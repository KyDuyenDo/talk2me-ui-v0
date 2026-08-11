import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashcardSet, FlashcardFolder, Flashcard } from '../../core/entities';
import {
  getFlashcardFolders,
  getFlashcardSets,
  getFlashcardsInSet,
  createFlashcardFolder,
  createFlashcardSet,
  deleteFlashcardFolder,
  deleteFlashcardSet,
} from '../../infrastructure/api/talk2meApi';

export interface FlashcardDeckData {
  folders: FlashcardFolder[];
  studySets: FlashcardSet[];
}

/**
 * Custom React Query hook for Flashcard Deck (Folders + Sets).
 * Caches data for 5 minutes by default so navigating back and forth to /flashcards
 * renders INSTANTLY with 0 loading spinners or unnecessary network calls.
 */
export const useFlashcardDeckQuery = () => {
  return useQuery<FlashcardDeckData>({
    queryKey: ['flashcard-deck'],
    queryFn: async (): Promise<FlashcardDeckData> => {
      const [folderSummaries, setSummaries] = await Promise.all([
        getFlashcardFolders(),
        getFlashcardSets(),
      ]);

      const loadedSets: FlashcardSet[] = setSummaries.map((s: any) => ({
        ...s,
        cards: s.cards || [],
      }));

      const loadedFolders: FlashcardFolder[] = folderSummaries.map((f) => ({
        ...f,
        setIds: loadedSets.filter((s) => s.folderId === f.id).map((s) => s.id),
      }));

      return {
        folders: loadedFolders,
        studySets: loadedSets,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

/**
 * Custom React Query hook for fetching detailed cards of a specific FlashcardSet.
 */
export const useFlashcardSetDetailQuery = (setId?: string) => {
  return useQuery<Flashcard[]>({
    queryKey: ['flashcard-set-detail', setId],
    queryFn: async (): Promise<Flashcard[]> => {
      if (!setId) return [];
      return await getFlashcardsInSet(setId);
    },
    enabled: Boolean(setId),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Mutations for invalidating and updating the flashcard deck cache automatically.
 */
export const useDeleteFlashcardSetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setId: string) => {
      await deleteFlashcardSet(setId);
      return setId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck'] });
    },
  });
};

export const useDeleteFlashcardFolderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      await deleteFlashcardFolder(folderId);
      return folderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck'] });
    },
  });
};
