import { useContext } from 'react';
import { FlashcardContext } from '../context/FlashcardContext';

export function useFlashcards() {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
}
