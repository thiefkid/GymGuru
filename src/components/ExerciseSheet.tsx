import { useEffect, useRef, useState } from 'react';
import { guideFor, youtubeSearchUrl, youtubeWatchUrl } from '../exerciseGuides';
import type { Exercise } from '../program';
import { loadYouTube, type YouTubePlayer } from '../youtube';
import { Icon } from './Icon';

type VideoState = 'loading' | 'ready' | 'failed';

function Video({ id, name, searchUrl }: { id: string; name: string; searchUrl: string }) {
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
            <a className="accent-btn link-btn" href={searchUrl} target="_blank" rel="noopener noreferrer">
              Search YouTube
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** What the how-to sheet shows for one movement. */
export interface HowTo {
  name: string;
  /** Small heading above the name. */
  eyebrow?: string;
  /** The prescription under the name, such as "3 × 10 · RPE 8 · 2 min rest". */
  meta?: string;
  video?: string;
  cues?: string[];
  /** Short sections after the form tips, such as why it helps; 'knee' ones are highlighted. */
  notes?: { title: string; text: string; tone?: 'knee' }[];
  /** YouTube results for more videos of it. */
  searchUrl: string;
}

/** Bottom sheet with a how-to video, form cues and notes for one movement. */
export function HowToSheet({ item, onClose }: { item: HowTo | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = !!item;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

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
      {item && (
        <div className="sheet-panel">
          <div className="sheet-body">
            <span className="sheet-handle" aria-hidden="true" />
            <header className="row between start gap-md">
              <div className="stack-xs grow">
                <p className="eyebrow tiny">{item.eyebrow ?? 'How to do it'}</p>
                <h2 id="sheet-title" className="display lg">
                  {item.name}
                </h2>
                {item.meta && <p className="muted tiny-text">{item.meta}</p>}
              </div>
              <button className="icon-btn round" aria-label="Close" onClick={onClose}>
                <Icon name="close" />
              </button>
            </header>

            {item.video && <Video id={item.video} name={item.name} searchUrl={item.searchUrl} />}

            {item.cues && item.cues.length > 0 && (
              <section className="stack-sm">
                <h3 className="strong">Form tips</h3>
                <ol className="cues">
                  {item.cues.map((cue) => (
                    <li key={cue}>{cue}</li>
                  ))}
                </ol>
              </section>
            )}

            {item.notes?.map((note) => (
              <section key={note.title} className={`sheet-note ${note.tone === 'knee' ? 'is-knee' : ''}`}>
                <h3 className="eyebrow tiny accent">{note.title}</h3>
                <p className="small">{note.text}</p>
              </section>
            ))}

            <div className="stack-sm">
              {item.video && (
                <a className="secondary link-btn" href={youtubeWatchUrl(item.video)} target="_blank" rel="noopener noreferrer">
                  Open this video in YouTube
                </a>
              )}
              <a className="secondary link-btn" href={item.searchUrl} target="_blank" rel="noopener noreferrer">
                More videos on YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** How-to sheet for a movement of the W9-12 program. */
export function ExerciseSheet({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const guide = exercise ? guideFor(exercise.name) : undefined;
  const item: HowTo | null = exercise && {
    name: exercise.name,
    meta: `${exercise.sets} × ${exercise.reps}${exercise.rpe ? ` · RPE ${exercise.rpe}` : ''} · ${exercise.rest / 60} min rest`,
    video: guide?.video,
    cues: guide?.cues,
    searchUrl: youtubeSearchUrl(exercise.name),
  };
  return <HowToSheet item={item} onClose={onClose} />;
}
