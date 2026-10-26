import { useEffect, useRef, useState, type Dispatch } from 'react';
import { dayName, parseKey, sessionRows, sessionsFromRows, type SheetRow } from './logic';
import type { Action, State } from './store';

/** What a deployed Apps Script web app URL looks like. */
export function isScriptUrl(url: string): boolean {
  return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url.trim());
}

interface Reply {
  ok: boolean;
  error?: string;
  sheet?: string;
  rows?: SheetRow[];
}

async function call(url: string, body: Record<string, unknown>): Promise<Reply> {
  let res: Response;
  try {
    // text/plain keeps this a "simple" request, so the browser skips the CORS preflight Apps Script can't answer.
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Couldn’t reach Google. Check your connection.');
  }
  let reply: Reply;
  try {
    reply = await res.json();
  } catch {
    throw new Error('Google didn’t answer like the GymGuru script. Check the URL and that the web app is deployed for “Anyone”.');
  }
  if (!reply.ok) {
    throw new Error(
      reply.error === 'Wrong sync key'
        ? 'This sheet is linked to another phone’s sync key. Paste that key under “Already set up on another phone?”, or in Apps Script delete SYNC_KEY under Project Settings → Script properties and connect again.'
        : reply.error || 'The script refused the request.',
    );
  }
  return reply;
}

export async function connect(url: string, key: string): Promise<string> {
  const reply = await call(url.trim(), { action: 'ping', key });
  return reply.sheet ?? 'your sheet';
}

export async function pushSession(state: State, sessionKey: string): Promise<void> {
  const slot = parseKey(sessionKey);
  const session = state.logs[sessionKey];
  if (!slot || !session) return;
  await call(state.sync.url, {
    action: 'save',
    key: state.sync.key,
    session: {
      key: sessionKey,
      date: session.date,
      week: slot.week,
      day: dayName(slot.day),
      savedAt: state.saved[sessionKey] ?? '',
      rows: sessionRows(slot.week, slot.day, session),
    },
  });
}

export async function fetchFromSheet(state: State) {
  const reply = await call(state.sync.url, { action: 'export', key: state.sync.key });
  return sessionsFromRows(reply.rows ?? []);
}

/**
 * Sends queued workouts to the sheet one at a time while the phone is online,
 * retrying when the connection comes back, the app is reopened, or every minute.
 */
export function useSheetSync(state: State, dispatch: Dispatch<Action>) {
  const busy = useRef(false);
  const latest = useRef(state);
  latest.current = state;
  // Starts at 1 so a failure left over from last time is retried when the app opens.
  const [tick, setTick] = useState(1);

  const { url, queue, error } = state.sync;
  const pending = url ? queue.length : 0;

  useEffect(() => {
    if (!pending) return;
    const bump = () => setTick((t) => t + 1);
    const onVisible = () => document.visibilityState === 'visible' && bump();
    window.addEventListener('online', bump);
    document.addEventListener('visibilitychange', onVisible);
    const id = setInterval(bump, 60_000);
    return () => {
      window.removeEventListener('online', bump);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(id);
    };
  }, [pending]);

  useEffect(() => {
    if (!pending || busy.current || !navigator.onLine) return;
    // After a failure wait for a retry tick rather than looping.
    if (error && tick === 0) return;
    const key = queue[0];
    busy.current = true;
    pushSession(latest.current, key)
      .then(() => dispatch({ type: 'syncDone', key, at: new Date().toISOString() }))
      .catch((e: Error) => dispatch({ type: 'syncError', error: e.message }))
      .finally(() => {
        busy.current = false;
        setTick(0);
      });
  }, [pending, queue, error, tick, dispatch]);
}
