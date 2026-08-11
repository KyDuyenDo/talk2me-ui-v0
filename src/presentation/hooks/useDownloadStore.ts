import { useSyncExternalStore } from 'react';
import type { DownloadState, DownloadStore } from '../../infrastructure/ai/downloadStore';

/** Subscribes to a background model download store — always reflects the true current
 * state, even if this component wasn't the one that started the download or a previous
 * instance of it was unmounted mid-download (see downloadStore.ts). */
export function useDownloadStore(store: DownloadStore): DownloadState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
