// State for the snowboard plan. It lives under its own storage key, so it never touches the
// W9-12 block's workouts, history, backup or Google Sheet sync.

import { useEffect, useReducer } from 'react';
import { WEIGHT_STEP, formatWeight, parseWeight } from '../logic';
import {
  PLAN_WEEKS,
  bouts,
  isoDate,
  restAfter,
  sessionFor,
  sessionsFor,
  snowKey,
  weekOn,
  type Item,
  type Session,
  type SessionId,
} from './plan';

export type View = 'plan' | 'session' | 'summary';
export type KneeFeel = 'good' | 'achy' | 'sore';

export interface SnowLog {
  /** ISO date the session was started. */
  date: string;
  /** Per movement, which bouts are done: a set, or one side of a timed set. */
  done: Record<string, boolean[]>;
  /** Per movement, the weight used, as typed. */
  weight: Record<string, string>;
  /** How the right knee felt afterwards. */
  knee: KneeFeel | null;
}

export interface Hold {
  move: string;
  bout: number;
  /** Epoch ms when the timed set ends. */
  end: number;
}

export interface SnowState {
  version: 1;
  view: View;
  week: number;
  session: SessionId;
  logs: Record<string, SnowLog>;
  /** Session key → ISO time it was saved. */
  saved: Record<string, string>;
  /** Exercise shown during a session. */
  index: number;
  /** Epoch ms when the current rest ends. */
  restEnd: number | null;
  /** The timed set that is running. */
  hold: Hold | null;
}

export type SnowAction =
  | { type: 'select'; week: number; session?: SessionId }
  | { type: 'start'; date: string }
  | { type: 'view'; view: View }
  | { type: 'go'; index: number }
  | { type: 'toggle'; move: string; bout: number; now: number }
  | { type: 'startHold'; move: string; bout: number; now: number }
  | { type: 'endHold'; now: number }
  | { type: 'cancelHold' }
  | { type: 'setWeight'; move: string; value: string }
  | { type: 'stepWeight'; move: string; delta: number }
  | { type: 'addRest'; seconds: number }
  | { type: 'skipRest' }
  | { type: 'knee'; feel: KneeFeel }
  | { type: 'save'; now: string; today: string }
  | { type: 'reset'; today: string };

const STORAGE_KEY = 'gymguru:snowboard:v1';

/**
 * The session to open on: the first one not yet done, from the current week of the plan
 * onward. Weeks already past stay as they are; missed sessions aren't made up.
 */
export function suggestedSlot(saved: Record<string, string>, today: string): { week: number; session: SessionId } {
  const from = Math.min(Math.max(weekOn(today), 1), PLAN_WEEKS);
  for (let week = from; week <= PLAN_WEEKS; week++) {
    const next = sessionsFor(week).find((s) => !saved[snowKey(week, s.id)]);
    if (next) return { week, session: next.id };
  }
  return { week: from, session: 'a' };
}

export function initialSnow(today: string): SnowState {
  return {
    version: 1,
    view: 'plan',
    ...suggestedSlot({}, today),
    logs: {},
    saved: {},
    index: 0,
    restEnd: null,
    hold: null,
  };
}

export function isSnowState(value: unknown): value is SnowState {
  const v = value as SnowState;
  return !!v && typeof v === 'object' && v.version === 1 && typeof v.week === 'number' && typeof v.logs === 'object' && typeof v.saved === 'object';
}

/** Opens on the suggested session unless one is under way; drops a selection the plan doesn't have. */
export function normalizeSnow(state: SnowState, today: string): SnowState {
  const valid = Number.isInteger(state.week) && state.week >= 1 && state.week <= PLAN_WEEKS && !!sessionFor(state.week, state.session);
  if (valid && state.view !== 'plan') return state;
  return { ...state, view: 'plan', ...suggestedSlot(state.saved, today), index: 0, restEnd: null, hold: null };
}

function load(today: string): SnowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isSnowState(parsed)) return normalizeSnow({ ...initialSnow(today), ...parsed }, today);
    }
  } catch {
    // Unreadable storage: start fresh.
  }
  return initialSnow(today);
}

export function currentKey(state: SnowState): string {
  return snowKey(state.week, state.session);
}

export function currentSession(state: SnowState): Session {
  return sessionFor(state.week, state.session) ?? sessionsFor(state.week)[0];
}

/** Which bouts of a movement are done, sized to this week's sets. */
export function boutsOf(log: SnowLog | undefined, item: Item): boolean[] {
  const have = log?.done[item.move] ?? [];
  return Array.from({ length: bouts(item) }, (_, i) => !!have[i]);
}

export function hasProgress(log: SnowLog | undefined): boolean {
  return !!log && Object.values(log.done).some((d) => d.some(Boolean));
}

/** Sessions before this one, most recent first. */
function earlierSlots(week: number, session: SessionId): { week: number; session: SessionId }[] {
  const out: { week: number; session: SessionId }[] = [];
  for (let w = week; w >= 1; w--) {
    const ids = sessionsFor(w).map((s) => s.id);
    const before = w === week ? ids.slice(0, ids.indexOf(session)) : ids;
    for (const id of before.reverse()) out.push({ week: w, session: id });
  }
  return out;
}

/** The weight used for a movement the last time it was done, before this session. */
export function lastWeight(logs: Record<string, SnowLog>, week: number, session: SessionId, move: string): { weight: number; week: number } | null {
  for (const slot of earlierSlots(week, session)) {
    const log = logs[snowKey(slot.week, slot.session)];
    const weight = parseWeight(log?.weight[move] ?? '');
    if (log && weight !== null && weight > 0 && log.done[move]?.some(Boolean)) return { weight, week: slot.week };
  }
  return null;
}

export function buildLog(logs: Record<string, SnowLog>, week: number, session: Session, date: string): SnowLog {
  const done: Record<string, boolean[]> = {};
  const weight: Record<string, string> = {};
  for (const item of session.items) {
    done[item.move] = Array.from({ length: bouts(item) }, () => false);
    const last = lastWeight(logs, week, session.id, item.move);
    weight[item.move] = last ? formatWeight(last.weight) : '';
  }
  return { date, done, weight, knee: null };
}

export function currentLog(state: SnowState, date = isoDate(new Date())): SnowLog {
  return state.logs[currentKey(state)] ?? buildLog(state.logs, state.week, currentSession(state), date);
}

export function sessionStats(log: SnowLog, session: Session) {
  let done = 0;
  let total = 0;
  let exercisesDone = 0;
  for (const item of session.items) {
    const b = boutsOf(log, item);
    const n = b.filter(Boolean).length;
    done += n;
    total += b.length;
    if (n === b.length) exercisesDone++;
  }
  return { done, total, exercisesDone, exerciseCount: session.items.length };
}

/** The knee check from the most recently saved session, if it had one. */
export function lastKnee(state: SnowState): { feel: KneeFeel; week: number; session: SessionId } | null {
  let latest: string | null = null;
  for (const key of Object.keys(state.saved)) if (!latest || state.saved[key] > state.saved[latest]) latest = key;
  const match = latest && /^w(\d+):([abc])$/.exec(latest);
  const feel = latest ? state.logs[latest]?.knee : null;
  if (!match || !feel) return null;
  return { feel, week: Number(match[1]), session: match[2] as SessionId };
}

function withLog(state: SnowState, edit: (log: SnowLog, session: Session) => void): SnowState {
  const log = structuredClone(currentLog(state));
  edit(log, currentSession(state));
  return { ...state, logs: { ...state.logs, [currentKey(state)]: log } };
}

/** Marks a bout done and works out the rest that follows; `at` is when it was finished. */
function completeBout(state: SnowState, move: string, bout: number, at: number, toggle: boolean): SnowState {
  let restEnd = state.restEnd;
  let hold = state.hold;
  const next = withLog(state, (log, session) => {
    const item = session.items.find((i) => i.move === move);
    if (!item) return;
    const done = boutsOf(log, item);
    if (bout < 0 || bout >= done.length) return;
    if (!toggle && done[bout]) return;
    done[bout] = !done[bout];
    log.done[move] = done;
    if (hold?.move === move && hold.bout === bout) hold = null;
    if (!done[bout]) return;
    const rest = restAfter(item, done, bout);
    restEnd = rest ? at + rest * 1000 : null;
  });
  return { ...next, restEnd, hold };
}

export function snowReducer(state: SnowState, action: SnowAction): SnowState {
  switch (action.type) {
    case 'select': {
      const sessions = sessionsFor(action.week);
      const chosen =
        sessions.find((s) => s.id === action.session) ?? sessions.find((s) => !state.saved[snowKey(action.week, s.id)]) ?? sessions[0];
      return { ...state, week: action.week, session: chosen.id, index: 0 };
    }
    case 'start': {
      const key = currentKey(state);
      const session = currentSession(state);
      const log = state.logs[key] ?? buildLog(state.logs, state.week, session, action.date);
      const firstOpen = session.items.findIndex((i) => boutsOf(log, i).some((d) => !d));
      return { ...state, logs: { ...state.logs, [key]: log }, view: 'session', index: firstOpen < 0 ? 0 : firstOpen };
    }
    case 'view': {
      const keep = action.view === 'session';
      return { ...state, view: action.view, restEnd: keep ? state.restEnd : null, hold: keep ? state.hold : null };
    }
    case 'go':
      return { ...state, index: Math.max(0, Math.min(action.index, currentSession(state).items.length - 1)) };
    case 'toggle':
      return completeBout(state, action.move, action.bout, action.now, true);
    case 'startHold': {
      const item = currentSession(state).items.find((i) => i.move === action.move);
      if (!item?.hold) return state;
      return { ...state, hold: { move: action.move, bout: action.bout, end: action.now + item.hold * 1000 }, restEnd: null };
    }
    case 'endHold': {
      if (!state.hold) return state;
      const { move, bout, end } = state.hold;
      // A hold that ran out while the app was closed counts from when it ended, not from now.
      const next = completeBout(state, move, bout, Math.min(action.now, end), false);
      return { ...next, hold: null };
    }
    case 'cancelHold':
      return { ...state, hold: null };
    case 'setWeight':
      return withLog(state, (log) => {
        log.weight[action.move] = action.value;
      });
    case 'stepWeight':
      return withLog(state, (log) => {
        const weight = parseWeight(log.weight[action.move] ?? '') ?? 0;
        log.weight[action.move] = formatWeight(Math.max(0, weight + action.delta * WEIGHT_STEP));
      });
    case 'addRest':
      return state.restEnd ? { ...state, restEnd: state.restEnd + action.seconds * 1000 } : state;
    case 'skipRest':
      return { ...state, restEnd: null };
    case 'knee':
      return withLog(state, (log) => {
        log.knee = log.knee === action.feel ? null : action.feel;
      });
    case 'save': {
      const saved = { ...state.saved, [currentKey(state)]: action.now };
      return { ...state, saved, view: 'plan', index: 0, restEnd: null, hold: null, ...suggestedSlot(saved, action.today) };
    }
    case 'reset':
      return initialSnow(action.today);
  }
}

export function useSnowStore() {
  const [state, dispatch] = useReducer(snowReducer, undefined, () => load(isoDate(new Date())));
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked; the plan still works in memory.
    }
  }, [state]);
  return [state, dispatch] as const;
}
