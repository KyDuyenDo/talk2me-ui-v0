import {
  LearningModeType,
  QuizQuestion,
  DictationSegment,
  ShadowingLine,
  WritingPrompt,
  SpeakingPrompt,
  ModeProgress,
  VocabularyItem,
  GrammarStructureItem
} from './exercise';

export interface Category {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface Lesson {
  id: string;
  lessonIndex: number;
  title: string;
  durationMinutes: number;
  videoStartTime: string; // e.g. "0:00"
  videoEndTime: string;   // e.g. "8:50"
  startSeconds: number;
  endSeconds: number;
  theoryContent: string;
  keyTakeaways: string[];
  vocabulary?: VocabularyItem[];
  grammarStructures?: GrammarStructureItem[];
  quizQuestions: QuizQuestion[];
  dictationSegments: DictationSegment[];
  shadowingLines: ShadowingLine[];
  writingPrompt?: WritingPrompt;
  speakingPrompt?: SpeakingPrompt;
  availableModes: LearningModeType[];
  completedModes: LearningModeType[];
  modeProgress?: Partial<Record<LearningModeType, ModeProgress>>;
}

export interface Course {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnailUrl: string;
  channelName: string;
  durationText: string;
  totalLessons: number;
  rating: number;
  reviewsCount: number;
  badgeLabel?: 'Best Seller' | 'Popular' | 'New' | 'Top Rated' | 'Featured';
  price: number; // 0 = Free
  originalPrice?: number;
  isCustomGenerated?: boolean;
  creationStatus?: 'completed' | 'processing' | 'failed';
  generationError?: string | null;
  progressPercent: number;
  lessons: Lesson[];
  userId?: string;
  createdAt: string;
}

