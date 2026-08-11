export interface Flashcard {
  id: string;
  setId?: string;
  courseId?: string;
  lessonId?: string;
  frontText: string; // THUẬT NGỮ (Term)
  backText: string;  // ĐỊNH NGHĨA (Definition)
  phonetic?: string;
  exampleSentence?: string;
  imageUrl?: string;
  // "Zero-cost" video evidence — only the YouTube video id + a start/end second range is
  // stored, never a video file (see talk2me-ui/docs/modules/flashcard-srs.md).
  sourceVideoId?: string;
  clipStartSec?: number;
  clipEndSec?: number;
  nextReviewDate?: string; // ISO date
  intervalDays?: number;
  easeFactor?: number;
  repetitions?: number;
  status?: 'new' | 'learning' | 'mastered';
  isStarred?: boolean;
}

export interface FlashcardSet {
  id: string;
  folderId?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  cardsCount?: number;
  cards: Flashcard[];
}

export interface FlashcardFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  setIds: string[];
}
