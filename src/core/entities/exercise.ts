export type LearningModeType = 'theory' | 'quiz' | 'dictation' | 'shadowing' | 'writing' | 'speaking';

/** A user's latest saved attempt for one mode of one lesson — always the most recent
 * (server upserts by (user, lesson, mode), never keeps history). */
export interface ModeProgress {
  completed: boolean;
  accuracy: number | null;
}

export interface VocabularyItem {
  term: string;
  phonetic?: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation?: string;
  /** Real video timestamps for the example sentence — absent when the backend couldn't
   * confidently locate this sentence in the transcript, in which case no play button
   * should be shown rather than seeking to a guessed/wrong position. */
  startTime?: number;
  endTime?: number;
}

/** Independent from VocabularyItem — its own content type with its own fields, not derived
 * from or linked to any vocabulary entry. */
export interface GrammarStructureItem {
  pattern: string;
  explanation: string;
  exampleSentence: string;
  exampleTranslation?: string;
  startTime?: number;
  endTime?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  timestampSeconds?: number;
}

export interface DictationSegment {
  id: string;
  segmentIndex: number;
  startTime: number; // seconds
  endTime: number; // seconds
  targetText: string;
  translationText?: string;
  hintKeyWords?: string[];
}

export interface ShadowingLine {
  id: string;
  segmentIndex: number;
  startTime: number;
  endTime: number;
  sampleText: string;
  phoneticText?: string;
}

export interface PhonemeGuidance {
  name: string;
  tip: string;
  videoUrl: string;
  exampleWords: string[];
}

export interface PhonemeScore {
  symbol: string;        // IPA symbol (e.g., "θ")
  arpabet: string;       // ARPAbet (e.g., "TH")
  score: number;         // 0-100%
  rawGop: number;        // Raw GOP value
  isCorrect: boolean;
  guidance?: PhonemeGuidance;
}

export interface WordScore {
  word: string;
  score: number;         // 0-100%
  phonemes: PhonemeScore[];
}

export interface ShadowingResult {
  overallScore: number;        // 0-100%
  pronunciationScore: number;  // % phonemes correct
  fluencyScore: number;        // pacing assessment
  wordAnalysis: WordScore[];
  inferenceTimeMs: number;
  /** Rough free-decode transcript of what the model actually heard (no target-text
   * constraint) — lets the user see what was recognized vs. the target sentence. */
  recognizedTranscript: string;
}

export interface WritingPrompt {
  id: string;
  promptText: string;
  hintText?: string;
  suggestedWordCount: number;
  sampleAnswer?: string;
}

export interface SpeakingPrompt {
  id: string;
  promptText: string;
  hintText?: string;
  sampleRecordingUrl?: string;
  phoneticGuide?: string;
}

export interface WritingEvaluation {
  overallScore: number; // e.g. 7.5 out of 9
  summary: string;
  criteria: {
    taskResponse: { score: number; feedback: string };
    coherenceCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalAccuracy: { score: number; feedback: string };
  };
  highlightedErrors: Array<{
    originalText: string;
    suggestedText: string;
    errorType: 'grammar' | 'vocabulary' | 'spelling' | 'punctuation';
    explanation: string;
  }>;
  improvedModelAnswer: string;
}

export interface SpeakingEvaluation {
  overallScore: number;
  summary: string;
  criteria: {
    pronunciation: { score: number; feedback: string };
    fluency: { score: number; feedback: string };
    intonation: { score: number; feedback: string };
    grammarLexicon: { score: number; feedback: string };
  };
  mispronouncedWords: Array<{
    word: string;
    userPhonetic: string;
    correctPhonetic: string;
    tip: string;
  }>;
}
