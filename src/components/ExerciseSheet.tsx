import { useEffect, useRef, useState } from 'react';
import { guideFor, youtubeSearchUrl, youtubeWatchUrl } from '../exerciseGuides';
import type { Exercise } from '../program';
import { loadYouTube, type YouTubePlayer } from '../youtube';
import { Icon } from './Icon';

type VideoState = 'loading' | 'ready' | 'failed';

function Video({ id, name }: { id: string; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VideoState>('loading');

  useEffect(() => {
    let player: YouTubePlayer | null = null;
    let cancelled = false;
    setState('loading');
    loadYouTube()
      .then((YT) => {
        if (cancelled || !host.current) return;
        const target = document.createElement('div');
        host.current.replaceChildren(target);
        player = new YT.Player(target, {
          host: 'https://www.youtube-nocookie.com',
          videoId: id,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: () => {
              if (cancelled) return;
              player?.getIframe().setAttribute('title', `${name} demo video`);
              setState('ready');
            },
            onError: () => !cancelled && setState('failed'),
          },
        });
      })
      .catch(() => !cancelled && setState('failed'));
    return () => {
      cancelled = true;
      player?.destroy();
      host.current?.replaceChildren();
    };
  }, [id, name]);

  return (
    <div className="video-frame">
      <div ref={host} className="video-host" />
      {state === 'loading' && (
        <div className="video-cover" role="status">
          <span className="muted small">Loading video…</span>
        </div>
      )}
      {state === 'failed' && (
        <div className="video-cover">
          <p className="small">{navigator.onLine ? 'This video can’t play here.' : 'You’re offline. Videos need an internet connection.'}</p>
          {navigator.onLine && (
            <a className="accent-btn link-btn" href={youtubeSearchUrl(name)} target="_blank" rel="noopener noreferrer">
              Search YouTube
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** Bottom sheet with a how-to video and form cues for one movement. */
export function ExerciseSheet({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (exercise && !d.open) d.showModal();
    if (!exercise && d.open) d.close();
  }, [exercise]);

  const guide = exercise ? guideFor(exercise.name) : undefined;

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        // A tap on the dimmed area (the dialog itself, outside the panel) closes it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {exercise && (
        <div className="sheet-panel">
          <div className="sheet-body">
            <span className="sheet-handle" aria-hidden="true" />
            <header className="row between start gap-md">
              <div className="stack-xs grow">
                <p className="eyebrow tiny">How to do it</p>
                <h2 id="sheet-title" className="display lg">
                  {exercise.name}
                </h2>
                <p className="muted tiny-text">
                  {exercise.sets} × {exercise.reps}
                  {exercise.rpe ? ` · RPE ${exercise.rpe}` : ''} · {exercise.rest / 60} min rest
                </p>
              </div>
              <button className="icon-btn round" aria-label="Close" onClick={onClose}>
                <Icon name="close" />
              </button>
            </header>

            {guide && <Video id={guide.video} name={exercise.name} />}

            {guide && (
              <section className="stack-sm">
                <h3 className="strong">Form tips</h3>
                <ol className="cues">
                  {guide.cues.map((cue) => (
                    <li key={cue}>{cue}</li>
                  ))}
                </ol>
              </section>
            )}

            <div className="stack-sm">
              {guide && (
                <a className="secondary link-btn" href={youtubeWatchUrl(guide.video)} target="_blank" rel="noopener noreferrer">
                  Open this video in YouTube
                </a>
              )}
              <a className="secondary link-btn" href={youtubeSearchUrl(exercise.name)} target="_blank" rel="noopener noreferrer">
                More videos on YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
