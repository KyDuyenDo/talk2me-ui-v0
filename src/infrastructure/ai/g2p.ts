/**
 * G2P (Grapheme-to-Phoneme) Engine — Client-side
 *
 * Lightweight rule-based G2P for English, with a built-in CMU dictionary
 * for common words. Falls back to heuristic rules for unknown words.
 *
 * This replaces the Python `g2p_en` library for browser use.
 */

import { ARPA_TO_IPA } from './phonemeLessons';
import { API_BASE_URL } from '../config';

const PHONEME_API_URL = `${API_BASE_URL}/phonemes/lookup`;

/**
 * Fetch ARPAbet phonemes for a full sentence from the backend cmudict API.
 * Returns word-by-word breakdown. Falls back to rule-based G2P for OOV words.
 *
 * This replaces the built-in MINI_CMU_DICT for production use.
 */
export async function fetchWordPhonemes(text: string): Promise<WordPhonemes[]> {
  try {
    const res = await fetch(PHONEME_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`Phoneme API error: ${res.status}`);

    const json = await res.json() as {
      data: Array<{ word: string; phonemes: string[]; found: boolean }>;
    };

    return json.data.map(item => {
      const arpabet = item.found && item.phonemes.length > 0
        ? item.phonemes
        : ruleBasedG2P(item.word);  // fallback rule-based for OOV
      const ipa = arpabet.map(a => ARPA_TO_IPA[a] || a);
      return { word: item.word, arpabet, ipa };
    });
  } catch {
    // If API is unreachable, gracefully fall back to local rule-based G2P
    console.warn('[g2p] Phoneme API unreachable — falling back to rule-based G2P');
    return textToWordPhonemes(text);
  }
}

/**
 * Fallback rule-based G2P for unknown/offline words.
 * Used when the backend CMU dictionary API is unreachable or for words not in dict.
 *
 * Rules map English letters and digraphs (th, sh, ch, ea...) to ARPAbet phonemes.
 */
const LETTER_RULES: Record<string, string> = {
  'a': 'AE', 'b': 'B', 'c': 'K', 'd': 'D', 'e': 'EH',
  'f': 'F', 'g': 'G', 'h': 'HH', 'i': 'IH', 'j': 'JH',
  'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N', 'o': 'AA',
  'p': 'P', 'q': 'K', 'r': 'R', 's': 'S', 't': 'T',
  'u': 'AH', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y',
  'z': 'Z',
};

/** Digraph rules (checked before single letters) */
const DIGRAPH_RULES: [string, string][] = [
  ['th', 'TH'], ['sh', 'SH'], ['ch', 'CH'], ['ph', 'F'],
  ['ng', 'NG'], ['ck', 'K'],  ['wh', 'W'],  ['qu', 'K'],
  ['ee', 'IY'], ['oo', 'UW'], ['ea', 'IY'], ['ou', 'AW'],
  ['ow', 'OW'], ['ai', 'EY'], ['ay', 'EY'], ['oi', 'OY'],
  ['oy', 'OY'], ['ey', 'IY'],
];

/**
 * Fallback rule-based G2P for words not in the dictionary.
 * This is simplified — production uses the backend CMU Dict API.
 */
function ruleBasedG2P(word: string): string[] {
  const phonemes: string[] = [];
  let i = 0;
  const w = word.toLowerCase();

  while (i < w.length) {
    // Try digraphs first
    let matched = false;
    if (i + 1 < w.length) {
      const digraph = w.substring(i, i + 2);
      for (const [pattern, phoneme] of DIGRAPH_RULES) {
        if (digraph === pattern) {
          phonemes.push(phoneme);
          i += 2;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const letter = w[i];
      if (letter in LETTER_RULES) {
        phonemes.push(LETTER_RULES[letter]);
      }
      i++;
    }
  }

  return phonemes;
}

// ─── Public API ──────────────────────────────────────

export interface WordPhonemes {
  word: string;
  arpabet: string[];  // ARPAbet phonemes
  ipa: string[];      // IPA phonemes
}

/**
 * Convert a single word to its phoneme representation via rule-based G2P.
 */
export function wordToPhonemes(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [];
  return ruleBasedG2P(clean);
}

/**
 * Convert a full sentence to word-by-word phoneme breakdown.
 */
export function textToWordPhonemes(text: string): WordPhonemes[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return words.map(w => {
    const clean = w.replace(/[^a-z]/g, '');
    const arpabet = wordToPhonemes(clean);
    const ipa = arpabet.map(a => ARPA_TO_IPA[a] || a);
    return { word: clean, arpabet, ipa };
  });
}
