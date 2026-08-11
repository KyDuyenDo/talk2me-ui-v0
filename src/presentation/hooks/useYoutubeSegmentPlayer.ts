import { useCallback, useRef } from 'react';

/**
 * Controls an embedded YouTube iframe (must have `enablejsapi=1` in its src) via the
 * postMessage Player API — no need to load the external youtube.com/iframe_api script.
 * `playSegment` seeks to `start`, plays, and auto-pauses at `end` via a timeout matched
 * to the segment's own duration (no need to poll currentTime back from the player).
 */
export function useYoutubeSegmentPlayer(videoId?: string) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`
    : undefined;

  const postCommand = useCallback((func: string, args: any[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  }, []);

  const playSegment = useCallback(
    (start: number, end: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      postCommand('seekTo', [start, true]);
      postCommand('playVideo');
      const durationMs = Math.max(0, end - start) * 1000;
      timeoutRef.current = setTimeout(() => postCommand('pauseVideo'), durationMs + 300);
    },
    [postCommand]
  );

  return { iframeRef, embedUrl, playSegment };
}
