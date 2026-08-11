/**
 * Phoneme Lessons Database — 44 IPA phonemes with tips, video URLs, example words.
 * Ported from Python PHONEME_LESSONS in the Colab notebook.
 */

import { PhonemeGuidance } from '../../core/entities';

/** Full IPA phoneme guidance database */
export const PHONEME_LESSONS: Record<string, PhonemeGuidance> = {
  // ─── Consonants ─────────────────────────────────────────
  'b': {
    name: 'Voiced bilabial plosive',
    tip: 'Hai môi chạm nhau rồi bung ra, rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_b',
    exampleWords: ['boy', 'baby', 'job'],
  },
  'd': {
    name: 'Voiced alveolar plosive',
    tip: 'Đầu lưỡi chạm bờ nướu, bung ra có rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_d',
    exampleWords: ['do', 'did', 'bad'],
  },
  'f': {
    name: 'Voiceless labiodental fricative',
    tip: 'Răng trên chạm môi dưới, thổi hơi ra nhẹ.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_f',
    exampleWords: ['fan', 'if', 'off'],
  },
  'ɡ': {
    name: 'Voiced velar plosive',
    tip: 'Cuống lưỡi chạm vòm mềm, bung ra có rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_g',
    exampleWords: ['go', 'big', 'dog'],
  },
  'h': {
    name: 'Voiceless glottal fricative',
    tip: 'Thở hơi ra từ cổ họng, không chạm lưỡi hay môi.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_h',
    exampleWords: ['hat', 'hello', 'behind'],
  },
  'k': {
    name: 'Voiceless velar plosive',
    tip: 'Cuống lưỡi chạm vòm mềm, bung ra không rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_k',
    exampleWords: ['cat', 'back', 'key'],
  },
  'l': {
    name: 'Alveolar lateral (l)',
    tip: 'Đầu lưỡi chạm bờ nướu, hơi thoát hai bên lưỡi.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_l',
    exampleWords: ['let', 'ball', 'like'],
  },
  'm': {
    name: 'Bilabial nasal',
    tip: 'Ngậm hai môi lại, hơi thoát ra qua mũi.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_m',
    exampleWords: ['man', 'come', 'swim'],
  },
  'n': {
    name: 'Alveolar nasal',
    tip: 'Đầu lưỡi chạm bờ nướu, hơi thoát qua mũi.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_n',
    exampleWords: ['no', 'sun', 'ten'],
  },
  'ŋ': {
    name: 'Velar nasal (ng)',
    tip: 'Cuống lưỡi chạm vòm mềm, hơi ra qua mũi. Không phát thêm /g/.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ng',
    exampleWords: ['sing', 'think', 'running'],
  },
  'p': {
    name: 'Voiceless bilabial plosive',
    tip: 'Hai môi chạm nhau rồi bung ra, không rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_p',
    exampleWords: ['pen', 'top', 'happy'],
  },
  'ɹ': {
    name: 'Alveolar approximant (r)',
    tip: 'Cuộn lưỡi lên nhưng KHÔNG chạm vòm, khác hoàn toàn /r/ tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_r',
    exampleWords: ['red', 'car', 'right'],
  },
  's': {
    name: 'Voiceless alveolar fricative',
    tip: 'Đầu lưỡi gần bờ nướu, thổi hơi ra tạo tiếng xì.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_s',
    exampleWords: ['see', 'bus', 'city'],
  },
  't': {
    name: 'Voiceless alveolar plosive',
    tip: 'Đầu lưỡi chạm bờ nướu, bung ra không rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_t',
    exampleWords: ['top', 'sit', 'water'],
  },
  'v': {
    name: 'Voiced labiodental fricative',
    tip: 'Răng trên chạm môi dưới, rung dây thanh. Khác /f/ ở chỗ có rung.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_v',
    exampleWords: ['van', 'love', 'never'],
  },
  'w': {
    name: 'Voiced labio-velar approximant',
    tip: 'Tròn môi lại, lưỡi nâng phía sau. Giống "u" nhanh rồi chuyển nguyên âm.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_w',
    exampleWords: ['we', 'away', 'swim'],
  },
  'j': {
    name: 'Palatal approximant (y)',
    tip: 'Lưỡi nâng cao gần vòm cứng. Giống "i" rất nhanh rồi chuyển nguyên âm.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_y',
    exampleWords: ['yes', 'you', 'year'],
  },
  'z': {
    name: 'Voiced alveolar fricative',
    tip: 'Giống /s/ nhưng rung dây thanh. Đặt tay lên cổ sẽ cảm nhận rung.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_z',
    exampleWords: ['zoo', 'buzz', 'is'],
  },
  'θ': {
    name: 'Voiceless dental fricative (th)',
    tip: 'Đặt đầu lưỡi giữa hai hàm răng, thổi hơi ra mà KHÔNG rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_th',
    exampleWords: ['think', 'three', 'both'],
  },
  'ð': {
    name: 'Voiced dental fricative (th)',
    tip: 'Giống /θ/ nhưng ĐỒNG THỜI rung dây thanh quản.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_dh',
    exampleWords: ['this', 'that', 'mother'],
  },
  'ʃ': {
    name: 'Voiceless postalveolar fricative (sh)',
    tip: 'Đưa lưỡi lên gần vòm miệng, tròn môi, thổi hơi ra.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_sh',
    exampleWords: ['she', 'fish', 'nation'],
  },
  'ʒ': {
    name: 'Voiced postalveolar fricative',
    tip: 'Giống /ʃ/ nhưng rung dây thanh. Âm trong "vision", "measure".',
    videoUrl: 'https://youtu.be/PLACEHOLDER_zh',
    exampleWords: ['vision', 'measure', 'genre'],
  },
  'tʃ': {
    name: 'Voiceless postalveolar affricate (ch)',
    tip: 'Kết hợp /t/ + /ʃ/. Đầu lưỡi chạm nướu rồi bung ra thành "sh".',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ch',
    exampleWords: ['check', 'match', 'church'],
  },
  'dʒ': {
    name: 'Voiced postalveolar affricate (j)',
    tip: 'Kết hợp /d/ + /ʒ/. Giống /tʃ/ nhưng rung dây thanh.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_jh',
    exampleWords: ['job', 'edge', 'judge'],
  },

  // ─── Vowels ─────────────────────────────────────────
  'iː': {
    name: 'Close front vowel (ee)',
    tip: 'Miệng hẹp, lưỡi nâng cao phía trước. Kéo dài hơn /ɪ/.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ee',
    exampleWords: ['see', 'eat', 'tree'],
  },
  'ɪ': {
    name: 'Near-close near-front vowel (i)',
    tip: 'Miệng hơi mở hơn /iː/, lưỡi thấp hơn. Ngắn và thoải mái.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ih',
    exampleWords: ['sit', 'big', 'milk'],
  },
  'ɛ': {
    name: 'Open-mid front vowel (e)',
    tip: 'Miệng mở vừa, lưỡi ở giữa. Giống "e" tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_eh',
    exampleWords: ['bed', 'red', 'head'],
  },
  'æ': {
    name: 'Near-open front vowel',
    tip: 'Mở rộng miệng, hạ lưỡi, phát âm giữa /a/ và /e/. Âm rất khó cho người Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ae',
    exampleWords: ['cat', 'apple', 'black'],
  },
  'ɑ': {
    name: 'Open back vowel',
    tip: 'Mở miệng rộng, lưỡi thấp phía sau. Giống "a" dài.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_aa',
    exampleWords: ['father', 'hot', 'stop'],
  },
  'ɔ': {
    name: 'Open-mid back vowel',
    tip: 'Mở miệng vừa, tròn môi nhẹ, lưỡi thấp phía sau.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ao',
    exampleWords: ['thought', 'law', 'all'],
  },
  'ʊ': {
    name: 'Near-close near-back vowel',
    tip: 'Tròn môi nhẹ, lưỡi lùi phía sau. Ngắn, thoải mái.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_uh',
    exampleWords: ['put', 'good', 'book'],
  },
  'uː': {
    name: 'Close back vowel (oo)',
    tip: 'Tròn môi tối đa, lưỡi nâng cao phía sau. Kéo dài.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_oo',
    exampleWords: ['food', 'blue', 'too'],
  },
  'ʌ': {
    name: 'Open-mid back vowel (uh)',
    tip: 'Miệng mở vừa, lưỡi ở giữa thấp. Giống "ơ" ngắn tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_uh2',
    exampleWords: ['cup', 'bus', 'love'],
  },
  'ɝ': {
    name: 'R-colored vowel (er)',
    tip: 'Nguyên âm /ə/ kết hợp cuộn lưỡi — âm rất khó cho người Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_er',
    exampleWords: ['bird', 'her', 'nurse'],
  },

  // ─── Diphthongs ─────────────────────────────────────
  'eɪ': {
    name: 'Diphthong (ay)',
    tip: 'Bắt đầu từ /e/, trượt lên /ɪ/. Giống "ây" tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ey',
    exampleWords: ['day', 'take', 'play'],
  },
  'aɪ': {
    name: 'Diphthong (eye)',
    tip: 'Bắt đầu từ /a/, trượt lên /ɪ/. Giống "ai" tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ay',
    exampleWords: ['my', 'like', 'time'],
  },
  'ɔɪ': {
    name: 'Diphthong (oy)',
    tip: 'Bắt đầu từ /ɔ/, trượt lên /ɪ/. Giống "oi" tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_oy',
    exampleWords: ['boy', 'join', 'coin'],
  },
  'oʊ': {
    name: 'Diphthong (oh)',
    tip: 'Bắt đầu từ /o/, trượt lên /ʊ/. Tròn môi dần.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_ow',
    exampleWords: ['go', 'home', 'know'],
  },
  'aʊ': {
    name: 'Diphthong (ow)',
    tip: 'Bắt đầu từ /a/, trượt lên /ʊ/. Giống "ao" tiếng Việt.',
    videoUrl: 'https://youtu.be/PLACEHOLDER_aw',
    exampleWords: ['now', 'out', 'house'],
  },
};

/** ARPAbet → IPA mapping (used by G2P output conversion) */
export const ARPA_TO_IPA: Record<string, string> = {
  'AA': 'ɑ',
  'AE': 'æ',
  'AH': 'ʌ',
  'AO': 'ɔ',
  'AW': 'aʊ',
  'AY': 'aɪ',
  'B':  'b',
  'CH': 'tʃ',
  'D':  'd',
  'DH': 'ð',
  'EH': 'ɛ',
  'ER': 'ɝ',
  'EY': 'eɪ',
  'F':  'f',
  'G':  'ɡ',
  'HH': 'h',
  'IH': 'ɪ',
  'IY': 'iː',
  'JH': 'dʒ',
  'K':  'k',
  'L':  'l',
  'M':  'm',
  'N':  'n',
  'NG': 'ŋ',
  'OW': 'oʊ',
  'OY': 'ɔɪ',
  'P':  'p',
  'R':  'ɹ',
  'S':  's',
  'SH': 'ʃ',
  'T':  't',
  'TH': 'θ',
  'UH': 'ʊ',
  'UW': 'uː',
  'V':  'v',
  'W':  'w',
  'Y':  'j',
  'Z':  'z',
  'ZH': 'ʒ',
};

/**
 * Get guidance for a phoneme that was mispronounced.
 * Returns undefined if no guidance exists for this phoneme.
 */
export function getPhonemeGuidance(ipaSymbol: string): PhonemeGuidance | undefined {
  return PHONEME_LESSONS[ipaSymbol];
}
