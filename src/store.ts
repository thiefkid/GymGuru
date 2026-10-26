import { useEffect, useReducer } from 'react';
import {
  WEIGHT_STEP,
  buildSession,
  formatWeight,
  nextSlot,
  parseWeight,
  sessionKey,
  type Logs,
  type Saved,
  type SessionLog,
} from './logic';
import { program, type DayId } from './program';

export type Screen = 'today' | 'session' | 'summary' | 'history' | 'settings';

export interface SyncState {
  /** Apps Script web app URL; empty when sync isn't set up. */
  url: string;
  /** Secret the script accepts; generated on this phone, carried over by backups. */
  key: string;
  sheetName: string | null;
  /** Session keys saved but not yet written to the sheet. */
  queue: string[];
  lastSynced: string | null;
  error: string | null;
}

export interface State {
  version: 1;
  week: number;
  day: DayId;
  logs: Logs;
  saved: Saved;
  screen: Screen;
  exerciseIndex: number;
  historyDay: DayId;
  /** Epoch ms when the current rest ends; persisted so a reload keeps the timer. */
  restEnd: number | null;
  sync: SyncState;
}

export type Action =
  | { type: 'selectWeek'; week: number }
  | { type: 'selectDay'; day: DayId }
  | { type: 'start'; date: string }
  | { type: 'setWeight'; exerciseId: string; set: number; value: string }
  | { type: 'stepWeight'; exerciseId: string; set: number; delta: number }
  | { type: 'stepReps'; exerciseId: string; set: number; delta: number }
  | { type: 'toggleSet'; exerciseId: string; set: number; now: number }
  | { type: 'setRpe'; exerciseId: string; rpe: number }
  | { type: 'fillWeight'; exerciseId: string; value: string }
  | { type: 'goExercise'; index: number }
  | { type: 'addRest'; seconds: number }
  | { type: 'skipRest' }
  | { type: 'screen'; screen: Screen }
  | { type: 'historyDay'; day: DayId }
  | { type: 'save'; now: string }
  | { type: 'replace'; state: State }
  | { type: 'syncConnect'; url: string; sheetName: string }
  | { type: 'syncDisconnect' }
  | { type: 'syncSetKey'; key: string }
  | { type: 'syncAll' }
  | { type: 'syncDone'; key: string; at: string }
  | { type: 'syncError'; error: string }
  | { type: 'restore'; logs: Logs; saved: Saved };

const STORAGE_KEY = 'gymguru:v1';

export function randomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Sessions logged in the app (not the ones imported from the sheet's W9-12 tab). */
function appSaved(state: State): string[] {
  return Object.keys(state.saved).filter((k) => state.saved[k] !== 'sheet' && state.logs[k]);
}

export function initialState(): State {
  const saved: Saved = { 'w1:d3': 'sheet' };
  const slot = nextSlot(saved);
  return {
    version: 1,
    week: slot.week,
    day: slot.day,
    logs: {},
    saved,
    screen: 'today',
    exerciseIndex: 0,
    historyDay: slot.day,
    restEnd: null,
    sync: { url: '', key: randomKey(), sheetName: null, queue: [], lastSynced: null, error: null },
  };
}

export function isState(value: unknown): value is State {
  const v = value as State;
  return (
    !!v &&
    typeof v === 'object' &&
    v.version === 1 &&
    typeof v.week === 'number' &&
    typeof v.day === 'string' &&
    typeof v.logs === 'object' &&
    typeof v.saved === 'object'
  );
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isState(parsed)) return { ...initialState(), ...parsed };
    }
  } catch {
    // Unreadable storage: start fresh.
  }
  return initialState();
}

export function currentKey(state: State) {
  return sessionKey(state.week, state.day);
}

/** The session for the selected day: the logged one, or a fresh plan pre-filled from last week. */
export function currentSession(state: State, date = today()): SessionLog {
  return state.logs[currentKey(state)] ?? buildSession(state.logs, state.week, state.day, date);
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function withSession(state: State, edit: (session: SessionLog) => void): State {
  const session: SessionLog = structuredClone(currentSession(state));
  edit(session);
  return { ...state, logs: { ...state.logs, [currentKey(state)]: session } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'selectWeek':
      return { ...state, week: action.week, exerciseIndex: 0 };
    case 'selectDay':
      return { ...state, day: action.day, exerciseIndex: 0 };
    case 'start': {
      const session = state.logs[currentKey(state)] ?? buildSession(state.logs, state.week, state.day, action.date);
      const list = program(state.day, state.week);
      const firstOpen = list.findIndex((e) => session.exercises[e.id]?.sets.some((s) => !s.done));
      return {
        ...state,
        logs: { ...state.logs, [currentKey(state)]: session },
        screen: 'session',
        exerciseIndex: firstOpen < 0 ? 0 : firstOpen,
      };
    }
    case 'setWeight':
      return withSession(state, (s) => {
        s.exercises[action.exerciseId].sets[action.set].weight = action.value;
      });
    case 'stepWeight':
      return withSession(state, (s) => {
        const set = s.exercises[action.exerciseId].sets[action.set];
        set.weight = formatWeight(Math.max(0, (parseWeight(set.weight) ?? 0) + action.delta * WEIGHT_STEP));
      });
    case 'stepReps':
      return withSession(state, (s) => {
        const set = s.exercises[action.exerciseId].sets[action.set];
        set.reps = Math.max(0, set.reps + action.delta);
      });
    case 'toggleSet': {
      let restEnd = state.restEnd;
      const next = withSession(state, (s) => {
        const sets = s.exercises[action.exerciseId].sets;
        const set = sets[action.set];
        set.done = !set.done;
        if (!set.done) return;
        // Straight sets: carry the weight forward to the sets still to do.
        for (let i = action.set + 1; i < sets.length; i++) {
          if (!sets[i].done) sets[i].weight = set.weight;
        }
        const exercise = program(state.day, state.week).find((e) => e.id === action.exerciseId);
        restEnd = action.now + (exercise?.rest ?? 90) * 1000;
      });
      return { ...next, restEnd };
    }
    case 'setRpe':
      return withSession(state, (s) => {
        const log = s.exercises[action.exerciseId];
        log.rpe = log.rpe === action.rpe ? null : action.rpe;
      });
    case 'fillWeight':
      return withSession(state, (s) => {
        for (const set of s.exercises[action.exerciseId].sets) if (!set.done) set.weight = action.value;
      });
    case 'goExercise':
      return { ...state, exerciseIndex: action.index };
    case 'addRest':
      return state.restEnd ? { ...state, restEnd: state.restEnd + action.seconds * 1000 } : state;
    case 'skipRest':
      return { ...state, restEnd: null };
    case 'screen':
      return {
        ...state,
        screen: action.screen,
        restEnd: action.screen === 'session' ? state.restEnd : null,
        historyDay: action.screen === 'history' ? state.day : state.historyDay,
      };
    case 'historyDay':
      return { ...state, historyDay: action.day };
    case 'save': {
      const key = currentKey(state);
      const saved = { ...state.saved, [key]: action.now };
      const slot = nextSlot(saved);
      const queue = [...state.sync.queue.filter((k) => k !== key), key];
      return {
        ...state,
        saved,
        week: slot.week,
        day: slot.day,
        screen: 'today',
        exerciseIndex: 0,
        restEnd: null,
        sync: { ...state.sync, queue },
      };
    }
    case 'replace':
      return action.state;
    case 'syncConnect':
      return {
        ...state,
        sync: { ...state.sync, url: action.url, sheetName: action.sheetName, error: null, queue: appSaved(state) },
      };
    case 'syncDisconnect':
      return { ...state, sync: { ...state.sync, url: '', sheetName: null, queue: [], error: null } };
    case 'syncSetKey':
      return { ...state, sync: { ...state.sync, key: action.key } };
    case 'syncAll':
      return { ...state, sync: { ...state.sync, queue: appSaved(state), error: null } };
    case 'syncDone':
      return {
        ...state,
        sync: { ...state.sync, queue: state.sync.queue.filter((k) => k !== action.key), lastSynced: action.at, error: null },
      };
    case 'syncError':
      return { ...state, sync: { ...state.sync, error: action.error } };
    case 'restore': {
      const saved = { ...state.saved, ...action.saved };
      const slot = nextSlot(saved);
      return { ...state, logs: { ...state.logs, ...action.logs }, saved, week: slot.week, day: slot.day, exerciseIndex: 0 };
    }
  }
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked; the session still works in memory.
    }
  }, [state]);
  return [state, dispatch] as const;
}
