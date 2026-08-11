import { YT_TRANSCRIPT_EXTENSION_ID } from '../config';

export interface ExtensionTranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface ChromeRuntimeLike {
  sendMessage: (extensionId: string, message: unknown, callback: (response: any) => void) => void;
  lastError?: { message?: string };
}

declare global {
  interface Window {
    chrome?: { runtime?: ChromeRuntimeLike };
  }
}

const YOUTUBE_ID_PATTERN = /(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractYoutubeVideoId(youtubeUrl: string): string {
  const match = YOUTUBE_ID_PATTERN.exec(youtubeUrl.trim());
  return match ? match[1] : '';
}

/**
 * Asks the Talk2Me Transcript Helper Chrome extension (see talk2me-extension/) to fetch a
 * video's transcript using the user's own browser — sidesteps both YouTube's bot-detection
 * (real residential IP, not a datacenter/cloud IP like the backend) and CORS (extensions with
 * host_permissions aren't subject to it). Returns null whenever the extension can't help
 * (not installed, not Chrome, no captions, timeout, etc.) so the caller can fall back to
 * having the backend attempt its own (less reliable) fetch — never throws.
 */
export async function fetchTranscriptViaExtension(youtubeUrl: string): Promise<ExtensionTranscriptSegment[] | null> {
  const chromeRuntime = window.chrome?.runtime;
  if (!YT_TRANSCRIPT_EXTENSION_ID || !chromeRuntime?.sendMessage) return null;

  const videoId = extractYoutubeVideoId(youtubeUrl);
  if (!videoId) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: ExtensionTranscriptSegment[] | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timeout = setTimeout(() => finish(null), 8000);

    try {
      chromeRuntime.sendMessage(YT_TRANSCRIPT_EXTENSION_ID, { type: 'FETCH_TRANSCRIPT', videoId }, (response) => {
        clearTimeout(timeout);
        if (chromeRuntime.lastError || !response?.ok) {
          finish(null);
          return;
        }
        finish(response.segments as ExtensionTranscriptSegment[]);
      });
    } catch {
      clearTimeout(timeout);
      finish(null);
    }
  });
}
