import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Flashcard } from '../../core/entities';
import { LocalFlashcardRepository } from '../../infrastructure/storage/LocalFlashcardRepository';

const flashcardRepo = new LocalFlashcardRepository();

interface FlashcardContextType {
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  addFlashcard: (card: Flashcard) => void;
  addFlashcards: (cards: Flashcard[]) => void;
  updateFlashcard: (updated: Flashcard) => void;
}

export const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export const FlashcardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => flashcardRepo.getFlashcards());

  useEffect(() => {
    flashcardRepo.saveFlashcards(flashcards);
  }, [flashcards]);

  const addFlashcard = (card: Flashcard) => {
    setFlashcards((prev) => [card, ...prev]);
  };

  const addFlashcards = (newCards: Flashcard[]) => {
    setFlashcards((prev) => [...newCards, ...prev]);
  };

  const updateFlashcard = (updated: Flashcard) => {
    setFlashcards((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  return (
    <FlashcardContext.Provider
      value={{
        flashcards,
        setFlashcards,
        addFlashcard,
        addFlashcards,
        updateFlashcard,
      }}
    >
      {children}
    </FlashcardContext.Provider>
  );
};
