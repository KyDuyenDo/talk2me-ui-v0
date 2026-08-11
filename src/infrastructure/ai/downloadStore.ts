/**
 * Tiny external store for tracking a background model download's progress —
 * module-level state, not React component state, so it survives the downloading
 * component unmounting (e.g. the user navigates away from Settings mid-download).
 * The underlying fetch/Worker download was already unaffected by unmounting (plain
 * Promises keep running); what was actually lost was the *progress reporting*, since it
 * only ever reached whichever single component instance's `onProgress` callback happened
 * to be wired in at the time. Any component can subscribe to a store via useDownloadStore
 * (see presentation/hooks/useDownloadStore.ts) and see live, correct state regardless of
 * whether it was the one that started the download.
 */

export interface DownloadState {
  status: 'idle' | 'downloading' | 'downloaded' | 'error';
  progress: number;
  error?: string;
}

export interface DownloadStore {
  getSnapshot: () => DownloadState;
  subscribe: (listener: () => void) => () => void;
  setState: (next: DownloadState) => void;
}

export function createDownloadStore(initial: DownloadState): DownloadStore {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState: (next) => {
      state = next;
      listeners.forEach((listener) => listener());
    },
  };
}
