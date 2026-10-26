import { DAYS, SHEET_HISTORY, WEEKS, program, type DayId } from './program';

export interface SetLog {
  /** Kept as typed text so a half-typed "42." survives re-renders. */
  weight: string;
  reps: number;
  done: boolean;
}

export interface ExerciseLog {
  sets: SetLog[];
  rpe: number | null;
}

export interface SessionLog {
  /** ISO date the session was started. */
  date: string;
  exercises: Record<string, ExerciseLog>;
}

export type Logs = Record<string, SessionLog>;
/** Session key → ISO timestamp it was saved, or "sheet" for history imported from the spreadsheet. */
export type Saved = Record<string, string>;

export interface Slot {
  week: number;
  day: DayId;
}

export interface PastWeight {
  weight: number;
  week: number;
  source: 'app' | 'sheet';
  variant?: string;
}

export const WEIGHT_STEP = 2.5;

export const sessionKey = (week: number, day: DayId) => `w${week}:${day}`;

export function parseWeight(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function formatWeight(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Heaviest weight among the completed sets, or null. */
export function topWeightOf(log: ExerciseLog | undefined): number | null {
  let top: number | null = null;
  for (const set of log?.sets ?? []) {
    const w = parseWeight(set.weight);
    if (set.done && w !== null && (top === null || w > top)) top = w;
  }
  return top;
}

export function topWeight(logs: Logs, week: number, day: DayId, exerciseId: string): Omit<PastWeight, 'week'> | null {
  const key = sessionKey(week, day);
  const top = topWeightOf(logs[key]?.exercises[exerciseId]);
  if (top !== null) return { weight: top, source: 'app' };
  const sheet = SHEET_HISTORY[key]?.[exerciseId];
  if (sheet) return { weight: sheet.weight, source: 'sheet', variant: sheet.variant };
  return null;
}

/** The most recent earlier week of the block in which this exercise has a weight. */
export function lastWeight(logs: Logs, week: number, day: DayId, exerciseId: string): PastWeight | null {
  for (let w = week - 1; w >= 1; w--) {
    const top = topWeight(logs, w, day, exerciseId);
    if (top) return { ...top, week: w };
  }
  return null;
}

export function buildSession(logs: Logs, week: number, day: DayId, date: string): SessionLog {
  const exercises: Record<string, ExerciseLog> = {};
  for (const e of program(day, week)) {
    const last = lastWeight(logs, week, day, e.id);
    exercises[e.id] = {
      sets: Array.from({ length: e.sets }, () => ({ weight: last ? formatWeight(last.weight) : '', reps: e.reps, done: false })),
      rpe: null,
    };
  }
  return { date, exercises };
}

export function sessionStats(session: SessionLog, week: number, day: DayId) {
  let doneSets = 0;
  let totalSets = 0;
  let volume = 0;
  let exercisesDone = 0;
  const list = program(day, week);
  for (const e of list) {
    const sets = session.exercises[e.id]?.sets ?? [];
    let done = 0;
    for (const s of sets) {
      totalSets++;
      if (!s.done) continue;
      done++;
      const w = parseWeight(s.weight);
      if (w !== null) volume += w * s.reps;
    }
    doneSets += done;
    if (sets.length > 0 && done === sets.length) exercisesDone++;
  }
  return { doneSets, totalSets, volume, exercisesDone, exerciseCount: list.length };
}

export function hasProgress(session: SessionLog | undefined): boolean {
  return !!session && Object.values(session.exercises).some((e) => e.sets.some((s) => s.done));
}

export type Trend = 'up' | 'down' | 'same' | 'first' | 'none';

export function exerciseResult(log: ExerciseLog, last: PastWeight | null) {
  const top = topWeightOf(log);
  const setsDone = log.sets.filter((s) => s.done).length;
  let bestReps = 0;
  for (const s of log.sets) if (s.done && parseWeight(s.weight) === top && s.reps > bestReps) bestReps = s.reps;

  let trend: Trend = 'none';
  let delta = 0;
  if (top !== null && last) {
    delta = top - last.weight;
    trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
  } else if (top !== null) {
    trend = 'first';
  }
  return { top, bestReps, setsDone, trend, delta };
}

const ALL_SLOTS: Slot[] = WEEKS.flatMap((week) => DAYS.map((d) => ({ week, day: d.id })));

/** The slot after the furthest one saved, so "today" follows on from the last logged day. */
export function nextSlot(saved: Saved): Slot {
  let furthest = -1;
  ALL_SLOTS.forEach((slot, i) => {
    if (saved[sessionKey(slot.week, slot.day)]) furthest = i;
  });
  return ALL_SLOTS[Math.min(furthest + 1, ALL_SLOTS.length - 1)];
}

/** Every exercise that appears on a day across the block, with its latest name. */
export function exercisesForDay(day: DayId): { id: string; name: string }[] {
  const order: string[] = [];
  const names: Record<string, string> = {};
  for (const week of WEEKS) {
    for (const e of program(day, week)) {
      if (!(e.id in names)) order.push(e.id);
      names[e.id] = e.name;
    }
  }
  return order.map((id) => ({ id, name: names[id] }));
}

export function toCsv(logs: Logs): string {
  const rows = [['date', 'week', 'day', 'exercise', 'set', 'weight_kg', 'reps', 'rpe']];
  const keys = Object.keys(logs).sort();
  for (const key of keys) {
    const match = /^w(\d+):(d\d)$/.exec(key);
    if (!match) continue;
    const week = Number(match[1]);
    const day = match[2] as DayId;
    const session = logs[key];
    const dayName = DAYS.find((d) => d.id === day)?.name ?? day;
    for (const e of program(day, week)) {
      const log = session.exercises[e.id];
      log?.sets.forEach((s, i) => {
        if (!s.done) return;
        rows.push([session.date, String(week), dayName, e.name, String(i + 1), s.weight, String(s.reps), log.rpe === null ? '' : String(log.rpe)]);
      });
    }
  }
  return rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n';
}
