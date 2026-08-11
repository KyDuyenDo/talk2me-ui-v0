/**
 * PronunciationScorer — ONNX Runtime Web + CTC Forced Alignment + GOP Scoring
 *
 * Runs entirely in the browser:
 * 1. Audio → PCM 16kHz (audioProcessor)
 * 2. PCM → ONNX Wav2Vec2 INT8 → logits
 * 3. logits → CTC Forced Alignment (Viterbi)
 * 4. Alignment + G2P → GOP scores per phoneme
 *
 * Ported from the Python notebook pipeline.
 */

import * as ort from 'onnxruntime-web';
import { unzipSync } from 'fflate';
import { blobToPcm16k, normalizeAudio } from './audioProcessor';
import { ORT_WASM_BASE_URL } from '../config';
import { fetchWordPhonemes, textToWordPhonemes } from './g2p';
import { ARPA_TO_IPA, getPhonemeGuidance } from './phonemeLessons';
import { getStoredModelBuffer, downloadModel, MODEL_DOWNLOAD_URL } from './resourceManager';
import type { ShadowingResult, WordScore, PhonemeScore } from '../../core/entities';

// ─── Configuration ───────────────────────────────────────

const MODEL_URL = MODEL_DOWNLOAD_URL;

const GOP_THRESHOLD = -1.5;

/** Wav2Vec2 vocabulary (CTC chars) — 32 tokens from wav2vec2-base-960h */
const VOCAB: Record<string, number> = {
  '<pad>': 0, '<s>': 1, '</s>': 2, '<unk>': 3,
  '|': 4, // word separator (space)
  'E': 5, 'T': 6, 'A': 7, 'O': 8, 'N': 9, 'I': 10, 'H': 11,
  'S': 12, 'R': 13, 'D': 14, 'L': 15, 'U': 16, 'M': 17,
  'W': 18, 'C': 19, 'F': 20, 'G': 21, 'Y': 22, 'P': 23,
  'B': 24, 'V': 25, 'K': 26, "'": 27, 'X': 28, 'J': 29,
  'Q': 30, 'Z': 31,
};

const ID_TO_TOKEN: Record<number, string> = {};
for (const [token, id] of Object.entries(VOCAB)) {
  ID_TO_TOKEN[id] = token;
}

const BLANK_ID = 0; // <pad>
const SPACE_ID = 4; // |

// ─── Aligned Segment ─────────────────────────────────────

interface AlignedSegment {
  label: string;
  tokenId: number;
  startFrame: number;
  endFrame: number; // exclusive
  score: number;    // mean log-probability
  /** True when Viterbi found zero real frames for this character (common for very short
   * words like "a" squeezed out by longer neighbors) — `score` is then just a guess read
   * from an interpolated position, not real evidence, and should not be trusted alone. */
  interpolated: boolean;
}

// ─── CTC Forced Alignment (Viterbi) ─────────────────────

/**
 * CTC Forced Alignment via Viterbi decoding.
 * Ported directly from the Python `ctc_forced_align_fixed` function.
 */
function ctcForcedAlign(
  logProbs: Float32Array,
  T: number,
  V: number,
  targetIds: number[]
): AlignedSegment[] {
  const N = targetIds.length;
  if (N === 0) return [];

  const S = 2 * N + 1;

  // Build state labels: [blank, char0, blank, char1, ..., blank]
  const stateLabels = new Int32Array(S);
  for (let i = 0; i < N; i++) {
    stateLabels[2 * i] = BLANK_ID;
    stateLabels[2 * i + 1] = targetIds[i];
  }
  stateLabels[S - 1] = BLANK_ID;

  const NEG_INF = -1e9;

  // DP tables
  const dp = new Float64Array(T * S).fill(NEG_INF);
  const bp = new Int32Array(T * S).fill(-1);

  const dpIdx = (t: number, s: number) => t * S + s;
  const lpIdx = (t: number, v: number) => t * V + v;

  // Base case: t = 0
  dp[dpIdx(0, 0)] = logProbs[lpIdx(0, stateLabels[0])];
  if (S > 1) {
    dp[dpIdx(0, 1)] = logProbs[lpIdx(0, stateLabels[1])];
  }

  // Forward Viterbi pass
  for (let t = 1; t < T; t++) {
    for (let s = 0; s < S; s++) {
      const emit = logProbs[lpIdx(t, stateLabels[s])];

      // Option 1: Stay at current state
      let best = dp[dpIdx(t - 1, s)];
      let bestPrev = s;

      // Option 2: From s-1
      if (s >= 1) {
        const val = dp[dpIdx(t - 1, s - 1)];
        if (val > best) {
          best = val;
          bestPrev = s - 1;
        }
      }

      // Option 3: From s-2 (skip blank between different chars)
      if (
        s >= 2 &&
        s % 2 === 1 &&
        stateLabels[s] !== stateLabels[s - 2]
      ) {
        const val = dp[dpIdx(t - 1, s - 2)];
        if (val > best) {
          best = val;
          bestPrev = s - 2;
        }
      }

      dp[dpIdx(t, s)] = best + emit;
      bp[dpIdx(t, s)] = bestPrev;
    }
  }

  // Backtracking
  let currS: number;
  if (S >= 2 && dp[dpIdx(T - 1, S - 1)] >= dp[dpIdx(T - 1, S - 2)]) {
    currS = S - 1;
  } else if (S >= 2 && dp[dpIdx(T - 1, S - 2)] !== NEG_INF) {
    currS = S - 2;
  } else {
    // Find highest valid state at T-1
    currS = 0;
    for (let s = S - 1; s >= 0; s--) {
      if (dp[dpIdx(T - 1, s)] > NEG_INF) {
        currS = s;
        break;
      }
    }
  }

  const path = new Int32Array(T);
  path[T - 1] = currS;
  for (let t = T - 2; t >= 0; t--) {
    currS = bp[dpIdx(t + 1, currS)];
    if (currS === -1) currS = 0;
    path[t] = currS;
  }

  // Group segments for each target token
  const segments: AlignedSegment[] = [];
  for (let i = 0; i < N; i++) {
    const targetState = 2 * i + 1;

    // Find frames assigned to this state
    let startF = -1;
    let endF = -1;
    for (let t = 0; t < T; t++) {
      if (path[t] === targetState) {
        if (startF === -1) startF = t;
        endF = t + 1;
      }
    }

    let meanScore: number;
    let interpolated = false;
    if (startF >= 0) {
      let sumScore = 0;
      let count = 0;
      for (let t = startF; t < endF; t++) {
        sumScore += logProbs[lpIdx(t, targetIds[i])];
        count++;
      }
      meanScore = sumScore / count;
    } else {
      // Viterbi assigned this character zero frames — common for very short/fast letters
      // (e.g. the word "a") squeezed out by longer neighboring words. The interpolated
      // position is only a proportional guess, not real evidence — it can easily land
      // mid-way through a NEIGHBORING word instead of where "a" actually was, so the
      // log-probability read here is unreliable and callers should not trust it alone
      // (see the `interpolated` flag — mapToPhonemeScores falls back to checking the
      // free-decode transcript for these instead of scoring off this frame guess).
      interpolated = true;
      startF = Math.floor((i / N) * T);
      endF = Math.min(startF + 1, T);
      meanScore = logProbs[lpIdx(startF, targetIds[i])];
    }

    segments.push({
      label: ID_TO_TOKEN[targetIds[i]] || '?',
      tokenId: targetIds[i],
      startFrame: startF,
      endFrame: endF,
      score: meanScore,
      interpolated,
    });
  }

  return segments;
}

// ─── Log-softmax ─────────────────────────────────────────

function logSoftmax(logits: Float32Array, T: number, V: number): Float32Array {
  const result = new Float32Array(T * V);

  for (let t = 0; t < T; t++) {
    const offset = t * V;

    // Find max
    let maxVal = -Infinity;
    for (let v = 0; v < V; v++) {
      if (logits[offset + v] > maxVal) maxVal = logits[offset + v];
    }

    // Compute sum(exp(x - max))
    let sumExp = 0;
    for (let v = 0; v < V; v++) {
      sumExp += Math.exp(logits[offset + v] - maxVal);
    }
    const logSumExp = Math.log(sumExp);

    // log_softmax = (x - max) - log(sum(exp(x - max)))
    for (let v = 0; v < V; v++) {
      result[offset + v] = logits[offset + v] - maxVal - logSumExp;
    }
  }

  return result;
}

// ─── GOP → Percentage ────────────────────────────────────

function gopToPercent(gop: number): number {
  const score = ((gop + 3.0) / 3.0) * 100.0;
  return Math.max(0, Math.min(100, score));
}

// ─── Text → Char IDs ─────────────────────────────────────

function textToCharIds(text: string): number[] {
  const upper = text.toUpperCase().trim();
  const ids: number[] = [];

  for (const ch of upper) {
    if (ch in VOCAB) {
      const id = VOCAB[ch];
      if (id !== BLANK_ID && id !== SPACE_ID) {
        ids.push(id);
      }
    }
  }

  return ids;
}

// ─── Content-match guard ──────────────────────────────────
//
// CTC forced-alignment is FORCED: given any audio, it will always find *some* frame to
// pin each target character/phoneme to and score it, even if the audio contains a
// completely different sentence (or silence). Without an independent check of what was
// actually said, a wrong-content recording can still come back with a deceptively high
// score. A free (unconstrained) greedy CTC decode gives an actual transcript of what the
// model heard, which we compare against the target text before trusting the forced-align
// scores at all.

/** Greedy CTC decode: argmax per frame, collapse repeated ids, drop blanks. No language
 * model / beam search — just enough to sanity-check whether the audio roughly matches. */
function greedyCtcDecode(logProbs: Float32Array, T: number, V: number): string {
  const chars: string[] = [];
  let prevId = -1;

  for (let t = 0; t < T; t++) {
    let bestId = 0;
    let bestVal = -Infinity;
    for (let v = 0; v < V; v++) {
      const val = logProbs[t * V + v];
      if (val > bestVal) {
        bestVal = val;
        bestId = v;
      }
    }
    if (bestId !== BLANK_ID && bestId !== prevId) {
      chars.push(bestId === SPACE_ID ? ' ' : ID_TO_TOKEN[bestId] || '');
    }
    prevId = bestId;
  }

  return chars.join('').trim().replace(/\s+/g, ' ');
}

/** Character-level similarity ratio (1 - normalized Levenshtein distance), 0..1.
 * Character-level rather than word-level because the greedy decode is a rough ASR pass —
 * a genuine attempt at the target sentence will still share most letters even with
 * per-word mistakes, while a wrong sentence entirely shares very few. */
function textSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^a-z ]/g, '');
  const s2 = b.toLowerCase().replace(/[^a-z ]/g, '');
  const n = s1.length;
  const m = s2.length;
  if (n === 0 && m === 0) return 1;
  if (n === 0 || m === 0) return 0;

  const dp = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;

  for (let i = 1; i <= n; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const temp = dp[j];
      dp[j] = s1[i - 1] === s2[j - 1] ? prevDiag : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = temp;
    }
  }

  return 1 - dp[m] / Math.max(n, m);
}

/** Below this, the recording is treated as "didn't actually attempt this sentence" rather
 * than "attempted it with mistakes" — forced-alignment scores below this point are noise,
 * not a real assessment. */
const CONTENT_MATCH_THRESHOLD = 0.4;

// ─── Map char segments → phoneme scores ──────────────────

// GOP values chosen so gopToPercent() lands on a clearly-good / clearly-bad percentage —
// used only as the word-level fallback below, not derived from any per-frame measurement.
const FALLBACK_GOP_RECOGNIZED = -0.45; // -> 85%
const FALLBACK_GOP_NOT_RECOGNIZED = -2.55; // -> 15%

async function mapToPhonemeScores(
  segments: AlignedSegment[],
  text: string,
  decodedTranscript: string
): Promise<WordScore[]> {
  const wordPhonemes = await fetchWordPhonemes(text);
  const decodedWords = new Set(decodedTranscript.toLowerCase().split(/\s+/).filter(Boolean));
  const results: WordScore[] = [];
  let segIdx = 0;

  for (const wp of wordPhonemes) {
    const nChars = wp.word.replace(/\s/g, '').length;
    const wordSegs = segments.slice(segIdx, segIdx + nChars);
    segIdx += nChars;

    if (wordSegs.length === 0 || wp.arpabet.length === 0) {
      results.push({ word: wp.word, score: 0, phonemes: [] });
      continue;
    }

    // Very short words (e.g. "a", "I") frequently get squeezed out of the Viterbi path
    // entirely by longer neighbors, leaving NO real frame-level evidence anywhere in this
    // word — scoring off an interpolated-position guess in that case tends to land mid-way
    // through a neighboring word and score low regardless of whether "a" was said correctly.
    // When that happens for the whole word, fall back to the free-decode transcript (which
    // has no such positional fragility) to check whether the word was recognized at all.
    const noRealAlignment = wordSegs.every((seg) => seg.interpolated);
    const cleanWordForLookup = wp.word.toLowerCase().replace(/[^a-z]/g, '');
    const recognizedByFreeDecode = noRealAlignment && decodedWords.has(cleanWordForLookup);

    const nPh = wp.arpabet.length;
    // Distribute this word's ALIGNED CHARACTERS across its phonemes (proportionally —
    // char-count and phoneme-count rarely match exactly for English spelling).
    const charsPerPh = wordSegs.length / nPh;

    const phResults: PhonemeScore[] = [];

    for (let i = 0; i < nPh; i++) {
      const arpa = wp.arpabet[i];
      const startIdx = Math.floor(i * charsPerPh);
      const endIdx = i === nPh - 1 ? wordSegs.length : Math.max(startIdx + 1, Math.floor((i + 1) * charsPerPh));
      const phSegs = wordSegs.slice(startIdx, endIdx);

      let gop: number;
      if (noRealAlignment) {
        gop = recognizedByFreeDecode ? FALLBACK_GOP_RECOGNIZED : FALLBACK_GOP_NOT_RECOGNIZED;
      } else {
        // Use the per-target-character log-probability that ctcForcedAlign already computed
        // (it correctly indexes logProbs at the TARGET character's own id — see
        // AlignedSegment.score). Previously this rescanned logProbs taking max() across ALL
        // 32 letter classes per frame, which measures "was the model confident about *some*
        // letter here" (true for almost any clearly-spoken audio, right or wrong) instead of
        // "was the model confident about *this* letter" — so mispronunciations and even
        // wrong words scored as high as correct ones.
        gop = phSegs.length > 0
          ? phSegs.reduce((sum, seg) => sum + seg.score, 0) / phSegs.length
          : FALLBACK_GOP_NOT_RECOGNIZED;
      }

      const ipa = ARPA_TO_IPA[arpa] || arpa;
      const isCorrect = gop >= GOP_THRESHOLD;
      const guidance = !isCorrect ? getPhonemeGuidance(ipa) : undefined;

      phResults.push({
        symbol: ipa,
        arpabet: arpa,
        score: Math.round(gopToPercent(gop) * 10) / 10,
        rawGop: Math.round(gop * 1000) / 1000,
        isCorrect,
        guidance,
      });
    }

    const wordScore = phResults.reduce((s, p) => s + p.score, 0) / phResults.length;
    results.push({
      word: wp.word,
      score: Math.round(wordScore * 10) / 10,
      phonemes: phResults,
    });
  }

  return results;
}

// ─── Model Cache ─────────────────────────────────────────

let cachedSession: ort.InferenceSession | null = null;

/**
 * Load or retrieve cached ONNX inference session.
 * On first call, downloads the model (~95MB) and caches it.
 */
async function getSession(
  onProgress?: (percent: number) => void
): Promise<ort.InferenceSession> {
  if (cachedSession) return cachedSession;

  // Configure ONNX Runtime Web.
  // wasmPaths MUST be set explicitly: onnxruntime-web dynamically `import()`s its own
  // ort-wasm-simd-threaded.*.mjs glue file at load time. It can't be served from Vite's
  // public/ dir — Vite's dev server hard-refuses to serve anything under publicDir to a JS
  // `import()` ("should not be imported from source code"). Served from the backend instead
  // (a different origin entirely, so Vite's dev server never sees the request) — see
  // talk2me-api/main.py's /ort static mount, files copied from node_modules/onnxruntime-web/dist.
  ort.env.wasm.wasmPaths = ORT_WASM_BASE_URL;
  ort.env.wasm.numThreads = 1;

  // Check if model is already stored in browser CacheStorage
  let downloadedBuffer = await getStoredModelBuffer();

  if (!downloadedBuffer) {
    // Download via resourceManager with progress tracking
    downloadedBuffer = await downloadModel((percent) => {
      onProgress?.(Math.round(percent * 0.85));
    });
  } else {
    onProgress?.(80);
  }

  onProgress?.(90);

  // Extract .onnx file if downloaded file is a zip (handles nested zips too)
  let onnxBuffer: Uint8Array = downloadedBuffer;
  function extractOnnx(buffer: Uint8Array): Uint8Array | null {
    try {
      const files = unzipSync(buffer);
      for (const [path, data] of Object.entries(files)) {
        if (path.endsWith('.onnx')) {
          return data;
        }
        if (path.endsWith('.zip')) {
          const nested = extractOnnx(data);
          if (nested) return nested;
        }
      }
    } catch {
      // Not a zip file, assume raw .onnx
    }
    return null;
  }

  const extracted = extractOnnx(downloadedBuffer);
  if (extracted) {
    onnxBuffer = extracted;
  }

  onProgress?.(95);

  // Create session
  const opts: ort.InferenceSession.SessionOptions = {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  };

  cachedSession = await ort.InferenceSession.create(onnxBuffer.buffer, opts);
  onProgress?.(100);

  return cachedSession;
}

// ─── Public API ──────────────────────────────────────────

export type ScorerStatus = 'idle' | 'loading-model' | 'scoring' | 'ready' | 'error';

/**
 * Score pronunciation of an audio recording against target text.
 *
 * Pipeline:
 * 1. Audio Blob → PCM 16kHz mono (Float32Array)
 * 2. ONNX Wav2Vec2 INT8 inference → logits
 * 3. Log-softmax → log probabilities
 * 4. CTC Forced Alignment (Viterbi) → char segments
 * 5. G2P → map chars to phonemes → GOP scoring
 * 6. Return ShadowingResult with per-word, per-phoneme scores
 */
export async function scorePronounciation(
  audioBlob: Blob,
  targetText: string,
  onProgress?: (percent: number) => void,
  onStatusChange?: (status: ScorerStatus) => void
): Promise<ShadowingResult> {
  const t0 = performance.now();

  try {
    // 1. Load model
    onStatusChange?.('loading-model');
    const session = await getSession(onProgress);

    // 2. Process audio
    onStatusChange?.('scoring');
    const pcmRaw = await blobToPcm16k(audioBlob);
    const pcm = normalizeAudio(pcmRaw);

    // 3. Run inference
    const inputTensor = new ort.Tensor('float32', pcm, [1, pcm.length]);
    const inputName = session.inputNames[0];
    const results = await session.run({ [inputName]: inputTensor });
    const outputTensor = results[session.outputNames[0]];

    const logits = outputTensor.data as Float32Array;
    const shape = outputTensor.dims as readonly number[]; // [1, T, V]
    const T = shape[1] as number;
    const V = shape[2] as number;

    // Extract first batch
    const logitsFlat = logits.slice(0, T * V);

    // 4. Log-softmax
    const logProbs = logSoftmax(logitsFlat, T, V);

    // 4b. Content-match guard: free decode (no target constraint) to check whether the
    // audio is even roughly the right sentence before trusting a forced-alignment score.
    const decodedTranscript = greedyCtcDecode(logProbs, T, V);
    const contentSimilarity = textSimilarity(decodedTranscript, targetText);
    if (contentSimilarity < CONTENT_MATCH_THRESHOLD) {
      throw new Error(
        `Nội dung ghi âm không khớp với câu mẫu (nghe ra: "${decodedTranscript || '(im lặng hoặc không rõ)'}"). ` +
        `Hãy đọc đúng câu: "${targetText}"`
      );
    }

    // 5. Get char IDs from target text
    const charIds = textToCharIds(targetText);

    // 6. CTC Forced Alignment
    const segments = ctcForcedAlign(logProbs, T, V, charIds);

    // Fill labels
    for (const seg of segments) {
      seg.label = ID_TO_TOKEN[seg.tokenId] || '?';
    }

    // 7. Map to phoneme scores (async — calls cmudict API)
    const wordAnalysis = await mapToPhonemeScores(segments, targetText, decodedTranscript);

    // 8. Compute overall scores
    const allScores: number[] = [];
    let correctCount = 0;
    let totalPhonemes = 0;

    for (const wa of wordAnalysis) {
      for (const ph of wa.phonemes) {
        allScores.push(ph.rawGop);
        totalPhonemes++;
        if (ph.isCorrect) correctCount++;
      }
    }

    const overallGop = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : -3.0;

    const overallScore = Math.round(gopToPercent(overallGop) * 10) / 10;
    const pronunciationScore = totalPhonemes > 0
      ? Math.round((correctCount / totalPhonemes) * 100 * 10) / 10
      : 0;

    // Fluency: estimate from word-level score variance (lower variance = more fluent)
    const wordScores = wordAnalysis.map(w => w.score);
    const meanWordScore = wordScores.reduce((a, b) => a + b, 0) / (wordScores.length || 1);
    const variance = wordScores.reduce((sum, s) => sum + (s - meanWordScore) ** 2, 0) / (wordScores.length || 1);
    const fluencyScore = Math.round(Math.max(0, Math.min(100, 100 - Math.sqrt(variance))) * 10) / 10;

    const inferenceTimeMs = Math.round(performance.now() - t0);

    onStatusChange?.('ready');

    return {
      overallScore,
      pronunciationScore,
      fluencyScore,
      wordAnalysis,
      inferenceTimeMs,
      recognizedTranscript: decodedTranscript,
    };
  } catch (error) {
    onStatusChange?.('error');
    throw error;
  }
}

/**
 * Preload the model in background (e.g., when user opens Shadowing tab).
 */
export async function preloadModel(
  onProgress?: (percent: number) => void
): Promise<void> {
  await getSession(onProgress);
}
