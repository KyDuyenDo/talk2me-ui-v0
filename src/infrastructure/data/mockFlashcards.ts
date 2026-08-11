import { Flashcard, FlashcardFolder, FlashcardSet } from '../../core/entities';

export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc1',
    frontText: 'Semantic HTML',
    backText: 'HTML elements that convey meaning about their content to both browsers and developers (e.g., <main>, <article>).',
    phonetic: '/sɪˈmæntɪk ˌeɪʧ-tiː-ɛm-ˈɛl/',
    exampleSentence: 'Using semantic HTML improves screen reader accessibility.',
    nextReviewDate: new Date().toISOString(),
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 2,
    status: 'learning'
  },
  {
    id: 'fc2',
    frontText: 'Flexbox vs CSS Grid',
    backText: 'Flexbox is 1D (rows OR columns). Grid is 2D (rows AND columns simultaneously).',
    phonetic: '/ˈflɛksˌbɑks vɜrsəs ˈsiː-ɛs-ɛs grɪd/',
    exampleSentence: 'Use CSS grid for overall page layouts and flexbox for internal component alignment.',
    nextReviewDate: new Date().toISOString(),
    intervalDays: 3,
    easeFactor: 2.6,
    repetitions: 4,
    status: 'mastered'
  },
  {
    id: 'fc3',
    frontText: 'Marketing Funnel',
    backText: 'The customer journey through Awareness (TOFU), Interest (MOFU), Decision (BOFU), and Retention.',
    phonetic: '/ˈmɑrkətɪŋ ˈfʌnəl/',
    exampleSentence: 'Top of funnel content focuses on educational value rather than direct selling.',
    nextReviewDate: new Date().toISOString(),
    intervalDays: 1,
    easeFactor: 2.2,
    repetitions: 1,
    status: 'new'
  }
];

export const INITIAL_FLASHCARD_SETS: FlashcardSet[] = [
  {
    id: 'set-1',
    title: 'Từ vựng Frontend React & TypeScript',
    description: 'Bộ thẻ từ vựng chuyên ngành cho lập trình viên web frontend',
    isPublic: true,
    createdAt: '2026-03-01',
    cards: MOCK_FLASHCARDS,
  },
  {
    id: 'set-2',
    title: 'Digital Marketing & Growth Funnel',
    description: 'Các thuật ngữ cốt lõi trong phễu chuyển đổi và quảng cáo',
    isPublic: true,
    createdAt: '2026-03-05',
    cards: [
      {
        id: 'fc3',
        frontText: 'Marketing Funnel',
        backText: 'The customer journey through Awareness (TOFU), Interest (MOFU), Decision (BOFU), and Retention.',
        phonetic: '/ˈmɑrkətɪŋ ˈfʌnəl/',
        exampleSentence: 'Top of funnel content focuses on educational value rather than direct selling.',
        nextReviewDate: new Date().toISOString(),
        intervalDays: 1,
        easeFactor: 2.2,
        repetitions: 1,
        status: 'new'
      }
    ],
  }
];

export const INITIAL_FLASHCARD_FOLDERS: FlashcardFolder[] = [
  {
    id: 'folder-1',
    name: 'Lập Trình Web & UI/UX',
    description: 'Thư mục tổng hợp các học phần chuyên sâu về lập trình và thiết kế',
    color: '#2E68FF',
    createdAt: '2026-03-01',
    setIds: ['set-1'],
  },
  {
    id: 'folder-2',
    name: 'Marketing & Kinh Doanh',
    description: 'Các học phần chiến lược tiếp thị và tăng trưởng doanh nghiệp',
    color: '#F79009',
    createdAt: '2026-03-05',
    setIds: ['set-2'],
  }
];
