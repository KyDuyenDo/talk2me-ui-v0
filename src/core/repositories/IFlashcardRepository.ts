import { Flashcard } from '../entities';

export interface IFlashcardRepository {
  getFlashcards(): Flashcard[];
  saveFlashcards(flashcards: Flashcard[]): void;
}
