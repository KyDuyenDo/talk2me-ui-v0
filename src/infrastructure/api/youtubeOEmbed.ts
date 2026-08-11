export interface YoutubeOEmbedMetadata {
  title: string;
  channel: string;
  thumbnail: string;
}

/**
 * Fetches title/channel/thumbnail directly from YouTube's official oEmbed endpoint —
 * confirmed to support CORS (reflects Access-Control-Allow-Origin for any caller), so this
 * runs entirely client-side. Avoids depending on the backend's yt-dlp metadata fetch, which
 * is subject to the same YouTube bot-detection blocking as transcript fetching (see
 * docs/design-chrome-extension-transcript-2026-08-08.md). Returns null on any failure so
 * callers can fall back to letting the backend fetch metadata itself.
 */
export async function fetchYoutubeOEmbedMetadata(youtubeUrl: string): Promise<YoutubeOEmbedMetadata | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.title) return null;

    return {
      title: data.title as string,
      channel: (data.author_name as string) || 'YouTube',
      thumbnail: data.thumbnail_url as string,
    };
  } catch {
    return null;
  }
}
