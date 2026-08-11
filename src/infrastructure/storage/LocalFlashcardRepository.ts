import { Flashcard } from '../../core/entities';
import { IFlashcardRepository } from '../../core/repositories/IFlashcardRepository';
import { MOCK_FLASHCARDS } from '../data/mockFlashcards';

const FLASHCARDS_KEY = 't2m_flashcards';

export class LocalFlashcardRepository implements IFlashcardRepository {
  getFlashcards(): Flashcard[] {
    try {
      const saved = localStorage.getItem(FLASHCARDS_KEY);
      return saved ? JSON.parse(saved) : MOCK_FLASHCARDS;
    } catch {
      return MOCK_FLASHCARDS;
    }
  }

  saveFlashcards(flashcards: Flashcard[]): void {
    try {
      localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(flashcards));
    } catch (e) {
      console.error('Failed to save flashcards', e);
    }
  }
}
