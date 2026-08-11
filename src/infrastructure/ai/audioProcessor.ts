/**
 * AudioProcessor — Convert browser audio (WebM/WAV Blob) → Float32Array PCM 16kHz mono
 * Used by the pronunciation scorer before feeding into ONNX Runtime Web.
 */

const TARGET_SAMPLE_RATE = 16000;

/**
 * Convert an audio Blob (WebM, WAV, etc.) to Float32Array PCM at 16kHz mono.
 * Uses the browser's built-in AudioContext for decoding + resampling.
 */
export async function blobToPcm16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();

  // Decode audio using browser's AudioContext
  const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // If already 16kHz mono, just grab the data
    if (audioBuffer.sampleRate === TARGET_SAMPLE_RATE && audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    }

    // Otherwise, resample using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(
      1, // mono
      Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE),
      TARGET_SAMPLE_RATE
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampled = await offlineCtx.startRendering();
    return resampled.getChannelData(0);
  } finally {
    await audioContext.close();
  }
}

/**
 * Normalize audio to zero-mean, unit-variance.
 * This matches what Wav2Vec2FeatureExtractor does.
 */
export function normalizeAudio(pcm: Float32Array): Float32Array {
  const n = pcm.length;
  if (n === 0) return pcm;

  let sum = 0;
  for (let i = 0; i < n; i++) sum += pcm[i];
  const mean = sum / n;

  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const d = pcm[i] - mean;
    sumSq += d * d;
  }
  const std = Math.sqrt(sumSq / n) + 1e-7;

  const normalized = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    normalized[i] = (pcm[i] - mean) / std;
  }
  return normalized;
}
