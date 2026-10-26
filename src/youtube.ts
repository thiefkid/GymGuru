// Minimal loader for the YouTube IFrame Player API, used so the app can tell when a video
// won't play (removed, or embedding turned off) and offer a YouTube search instead.

export interface YouTubePlayer {
  destroy(): void;
  getIframe(): HTMLIFrameElement;
}

export interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void; onError?: (e: { data: number }) => void };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YouTubeApi> | null = null;

export function loadYouTube(timeoutMs = 12000): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!loading) {
    loading = new Promise<YouTubeApi>((resolve, reject) => {
      const fail = () => {
        loading = null;
        reject(new Error('YouTube unavailable'));
      };
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT?.Player) resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        script.remove();
        fail();
      };
      document.head.appendChild(script);
      setTimeout(() => {
        if (!window.YT?.Player) fail();
      }, timeoutMs);
    });
  }
  return loading;
}
