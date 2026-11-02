// The snowboard prep plan: 7 training weeks and a taper week, 3 sessions a week, counted back
// from the first day on the snow. Kept apart from the W9-12 gym program.

import { MOVES, type MoveId } from './moves';

/** First day on the snow. The weeks of the plan are counted back from it. */
export const TRIP_DATE = '2026-12-25';
/** 7 training weeks and a taper week. */
export const PLAN_WEEKS = 8;

export type SessionId = 'a' | 'b' | 'c';
export type Each = 'leg' | 'side' | 'way';

export interface Item {
  move: MoveId;
  /** Part of the session, such as "Warm-up" or "Core". */
  block: string;
  sets: number;
  reps?: number;
  /** Seconds of work per set, for holds, carries and intervals. */
  hold?: number;
  /** The reps or time are per leg, per side, or each way. */
  each?: Each;
  /** Word after the reps, such as "steps". */
  unit?: string;
  /** Seconds between sets. */
  rest: number;
  /** The rest is easy pedalling (intervals). */
  easy?: boolean;
  /** This week's tip, such as the box height or tempo. */
  note?: string;
}

export interface Session {
  id: SessionId;
  name: string;
  focus: string;
  items: Item[];
}

export interface Phase {
  name: string;
  weeks: number[];
  goal: string;
  effort: string;
}

// A value per week of the phase, or one value for every week.
type PerWeek<T> = T | readonly T[];

interface Slot {
  move: MoveId;
  sets: PerWeek<number>;
  reps?: PerWeek<number>;
  hold?: PerWeek<number>;
  each?: Each;
  unit?: string;
  rest: number;
  easy?: boolean;
  /** '' for no note that week. */
  note?: PerWeek<string>;
}

interface SessionTemplate {
  id: SessionId;
  name: string;
  focus: string;
  blocks: [block: string, slots: Slot[]][];
}

interface PhaseTemplate extends Phase {
  sessions: SessionTemplate[];
}

const WARM_UP: Slot[] = [
  { move: 'bike', sets: 1, hold: 300, rest: 0 },
  { move: 'tke', sets: 2, reps: 12, each: 'leg', rest: 15 },
  { move: 'bandwalk', sets: 2, reps: 10, unit: 'steps', each: 'way', rest: 15 },
  { move: 'hip9090', sets: 1, reps: 8, each: 'side', rest: 0 },
];

const PHASES: PhaseTemplate[] = [
  {
    name: 'Foundation',
    weeks: [1, 2],
    goal: 'Learn the moves, wake up your core and get the right knee used to single-leg work.',
    effort: 'Easy to moderate: end every set with 3–4 good reps left. Slow, controlled reps.',
    sessions: [
      {
        id: 'a',
        name: 'Strength',
        focus: 'Squat · hinge · core',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'boxsquat', sets: 3, reps: [10, 12], rest: 90, note: ['Pick a dumbbell you could lift about 15 times.', 'A little heavier if week 1 felt easy.'] },
              { move: 'rdl', sets: 3, reps: [10, 12], rest: 90 },
            ],
          ],
          ['Balance', [{ move: 'slbalance', sets: 3, hold: [30, 40], each: 'leg', rest: 15 }]],
          [
            'Core',
            [
              { move: 'deadbug', sets: 3, reps: [8, 10], each: 'side', rest: 45 },
              { move: 'sideplank', sets: 3, hold: [20, 25], each: 'side', rest: 30, note: ['Knees down is fine to start.', ''] },
            ],
          ],
        ],
      },
      {
        id: 'b',
        name: 'Control',
        focus: 'Single leg · glutes · core',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'stepup', sets: 3, reps: [8, 10], each: 'leg', rest: 60, note: 'Low box, about mid-shin. Light dumbbells or none.' },
              { move: 'reverselunge', sets: 3, reps: [8, 10], each: 'leg', rest: 60, note: ['Bodyweight this week.', 'Add light dumbbells if last week felt steady.'] },
              { move: 'bridge', sets: 3, reps: [12, 15], rest: 45 },
            ],
          ],
          [
            'Core',
            [
              { move: 'birddog', sets: 3, reps: [6, 8], each: 'side', rest: 30 },
              { move: 'plank', sets: 3, hold: [25, 35], rest: 30 },
            ],
          ],
        ],
      },
      {
        id: 'c',
        name: 'Stamina',
        focus: 'Stance · side to side · cardio',
        blocks: [
          ['Warm-up', WARM_UP],
          ['Stance', [{ move: 'wallsit', sets: 3, hold: [30, 40], rest: 60 }]],
          [
            'Legs',
            [
              { move: 'lateralunge', sets: 3, reps: [6, 8], each: 'side', rest: 60, note: 'Bodyweight, only as deep as is comfortable.' },
              { move: 'calfraise', sets: 3, reps: 15, rest: 45 },
            ],
          ],
          ['Core', [{ move: 'pallof', sets: 3, reps: [10, 12], each: 'side', rest: 45 }]],
          ['Cardio', [{ move: 'intervals', sets: [6, 8], hold: 20, rest: 70, easy: true }]],
        ],
      },
    ],
  },
  {
    name: 'Build',
    weeks: [3, 4, 5],
    goal: 'Heavier, more single-leg work, and start training rotation and soft landings.',
    effort: 'Moderate to hard: about 2 good reps left. Add weight once the top of the range feels easy.',
    sessions: [
      {
        id: 'a',
        name: 'Strength',
        focus: 'Squat · hinge · rotation',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'gobletsquat', sets: [3, 4, 4], reps: [8, 8, 6], rest: 90, note: ['3 seconds down.', '3 seconds down.', 'Heavier than last week, 3 seconds down.'] },
              { move: 'slrdl', sets: 3, reps: [8, 10, 10], each: 'leg', rest: 60, note: ['Back toes resting on the floor is fine to start.', ''] },
            ],
          ],
          ['Balance', [{ move: 'bosusquat', sets: 3, reps: [10, 12, 12], rest: 60, note: ['', '', 'Pause 2 seconds at the bottom.'] }]],
          [
            'Core',
            [
              { move: 'chopdown', sets: 3, reps: [10, 12, 12], each: 'side', rest: 45 },
              { move: 'sideplank', sets: 3, hold: [30, 35, 40], each: 'side', rest: 30, note: 'Full side plank, on your feet.' },
            ],
          ],
        ],
      },
      {
        id: 'b',
        name: 'Control',
        focus: 'Knee control · glutes · core',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'stepdown', sets: 3, reps: [6, 8, 8], each: 'leg', rest: 60, note: ['', '', 'A slightly higher step.'] },
              { move: 'reverselunge', sets: [3, 4, 4], reps: [10, 8, 8], each: 'leg', rest: 60, note: 'With dumbbells.' },
              { move: 'slbridge', sets: 3, reps: [10, 12, 12], each: 'leg', rest: 45 },
            ],
          ],
          [
            'Core',
            [
              { move: 'deadbug', sets: 3, reps: [10, 10, 12], each: 'side', rest: 45, note: 'Slower: 3 seconds out, 3 seconds back.' },
              { move: 'suitcase', sets: 3, hold: [30, 40, 45], each: 'side', rest: 45 },
            ],
          ],
        ],
      },
      {
        id: 'c',
        name: 'Stamina',
        focus: 'Landings · stance · cardio',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Power',
            [
              { move: 'boxjump', sets: [3, 4, 4], reps: 5, rest: 90 },
              { move: 'skater', sets: 3, reps: [5, 6, 8], each: 'side', rest: 60 },
            ],
          ],
          ['Stance', [{ move: 'wallsit', sets: 3, hold: [45, 50, 60], rest: 60 }]],
          ['Legs', [{ move: 'ballcurl', sets: 3, reps: [8, 10, 12], rest: 60 }]],
          ['Cardio', [{ move: 'intervals', sets: [6, 8, 10], hold: 30, rest: 60, easy: true }]],
        ],
      },
    ],
  },
  {
    name: 'Ride-ready',
    weeks: [6, 7],
    goal: 'Snowboard-specific: power, rotation, edge balance and stamina for a full day on the hill.',
    effort: 'Hard but crisp: 1–2 reps left. Keep the weights and move them faster and cleaner.',
    sessions: [
      {
        id: 'a',
        name: 'Strength',
        focus: 'Squat · hinge · power',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'gobletsquat', sets: 4, reps: 6, rest: 90, note: ['Same or a bit heavier than week 5.', 'Same weight, drive up faster.'] },
              { move: 'slrdl', sets: 3, reps: 8, each: 'leg', rest: 60, note: 'Free-standing now, with a heavier dumbbell.' },
            ],
          ],
          ['Power', [{ move: 'medball', sets: 3, reps: [6, 8], each: 'side', rest: 60 }]],
          [
            'Core',
            [
              { move: 'rollout', sets: 3, reps: [8, 10], rest: 60 },
              { move: 'copenhagen', sets: 3, hold: [15, 20], each: 'side', rest: 30 },
            ],
          ],
        ],
      },
      {
        id: 'b',
        name: 'Control',
        focus: 'One leg · edges · rotation',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'slboxsquat', sets: 3, reps: [5, 6], each: 'leg', rest: 60 },
              { move: 'lateralunge', sets: 3, reps: 8, each: 'side', rest: 60, note: 'Hold a dumbbell at your chest.' },
              { move: 'tibraise', sets: 2, reps: [15, 20], rest: 30 },
            ],
          ],
          ['Balance', [{ move: 'bosustance', sets: 3, hold: [30, 45], rest: 45 }]],
          ['Core', [{ move: 'chopup', sets: 3, reps: [10, 12], each: 'side', rest: 45 }]],
        ],
      },
      {
        id: 'c',
        name: 'Stamina',
        focus: 'Long runs · falls · cardio',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Power',
            [
              { move: 'skater', sets: 3, reps: 6, each: 'side', rest: 60, note: 'Bigger hops now. Still hold every landing.' },
              { move: 'boxjump', sets: 3, reps: 5, rest: 90 },
            ],
          ],
          ['Stance', [{ move: 'wallsit', sets: 3, hold: [75, 90], rest: 60 }]],
          ['Falls', [{ move: 'fallpractice', sets: 2, reps: 5, unit: 'falls', rest: 60, note: 'Alternate backward and forward falls.' }]],
          ['Cardio', [{ move: 'intervals', sets: 10, hold: 30, rest: 45, easy: true }]],
        ],
      },
    ],
  },
  {
    name: 'Taper',
    weeks: [8],
    goal: 'Freshen up for the trip: two short sessions, nothing new and nothing to failure.',
    effort: 'Easy: you should leave feeling better than when you came in. Rest the day before you ride.',
    sessions: [
      {
        id: 'a',
        name: 'Strength',
        focus: 'Light · stay sharp',
        blocks: [
          ['Warm-up', WARM_UP],
          [
            'Legs',
            [
              { move: 'gobletsquat', sets: 2, reps: 6, rest: 90, note: 'About 80% of last week’s weight.' },
              { move: 'slrdl', sets: 2, reps: 6, each: 'leg', rest: 60 },
            ],
          ],
          ['Power', [{ move: 'medball', sets: 2, reps: 5, each: 'side', rest: 60 }]],
          ['Core', [{ move: 'sideplank', sets: 2, hold: 30, each: 'side', rest: 30 }]],
        ],
      },
      {
        id: 'b',
        name: 'Control',
        focus: 'Light · balance · falls',
        blocks: [
          ['Warm-up', WARM_UP],
          ['Stance', [{ move: 'wallsit', sets: 2, hold: 45, rest: 60 }]],
          ['Power', [{ move: 'skater', sets: 2, reps: 4, each: 'side', rest: 60, note: 'Small and crisp.' }]],
          ['Balance', [{ move: 'bosustance', sets: 2, hold: 30, rest: 45 }]],
          ['Core', [{ move: 'deadbug', sets: 2, reps: 8, each: 'side', rest: 45 }]],
          ['Falls', [{ move: 'fallpractice', sets: 1, reps: 5, unit: 'falls', rest: 0, note: 'A quick refresher.' }]],
        ],
      },
    ],
  },
];

function pick<T>(value: PerWeek<T>, i: number): T;
function pick<T>(value: PerWeek<T> | undefined, i: number): T | undefined;
function pick<T>(value: PerWeek<T> | undefined, i: number): T | undefined {
  if (!Array.isArray(value)) return value as T | undefined;
  return value[Math.min(i, value.length - 1)];
}

function phaseTemplate(week: number): PhaseTemplate {
  const w = Math.min(Math.max(1, week), PLAN_WEEKS);
  return PHASES.find((p) => p.weeks.includes(w))!;
}

function toPhase({ name, weeks, goal, effort }: PhaseTemplate): Phase {
  return { name, weeks, goal, effort };
}

export function phaseOf(week: number): Phase {
  return toPhase(phaseTemplate(week));
}

export function phases(): Phase[] {
  return PHASES.map(toPhase);
}

/** The sessions of a plan week, with that week's sets, reps, times and notes. */
export function sessionsFor(week: number): Session[] {
  const phase = phaseTemplate(week);
  const i = phase.weeks.indexOf(Math.min(Math.max(1, week), PLAN_WEEKS));
  return phase.sessions.map((s) => ({
    id: s.id,
    name: s.name,
    focus: s.focus,
    items: s.blocks.flatMap(([block, slots]) =>
      slots.map((slot) => {
        const item: Item = { move: slot.move, block, sets: pick(slot.sets, i), rest: slot.rest };
        const reps = pick(slot.reps, i);
        const hold = pick(slot.hold, i);
        const note = pick(slot.note, i);
        if (reps !== undefined) item.reps = reps;
        if (hold !== undefined) item.hold = hold;
        if (slot.each) item.each = slot.each;
        if (slot.unit) item.unit = slot.unit;
        if (slot.easy) item.easy = true;
        if (note) item.note = note;
        return item;
      }),
    ),
  }));
}

export function sessionFor(week: number, id: SessionId): Session | undefined {
  return sessionsFor(week).find((s) => s.id === id);
}

export function totalSessions(): number {
  let n = 0;
  for (let w = 1; w <= PLAN_WEEKS; w++) n += sessionsFor(w).length;
  return n;
}

export const snowKey = (week: number, session: SessionId) => `w${week}:${session}`;

export const SESSION_LETTER: Record<SessionId, string> = { a: 'A', b: 'B', c: 'C' };

// ---------- sets, sides and timing ----------

const EACH_LABEL: Record<Each, string> = { leg: 'per leg', side: 'per side', way: 'each way' };

/** Timed work done on each side is two bouts a set (right, then left); everything else is one. */
export function sidesPerSet(item: Item): 1 | 2 {
  return item.hold !== undefined && (item.each === 'leg' || item.each === 'side') ? 2 : 1;
}

export function bouts(item: Item): number {
  return item.sets * sidesPerSet(item);
}

export function boutInfo(item: Item, bout: number): { set: number; side: 'Right' | 'Left' | null } {
  const per = sidesPerSet(item);
  return { set: Math.floor(bout / per) + 1, side: per === 2 ? (bout % 2 === 0 ? 'Right' : 'Left') : null };
}

/** "30 s", "90 s", "1 min", "5 min". */
export function duration(seconds: number): string {
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  if (seconds < 120) return `${seconds} s`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * What one set asks for: "10", "8 per leg", "10 steps each way", "30 s per side", "20 s hard".
 * With `reps`, plain reps are spelled out ("10 reps") for where the number stands alone.
 */
export function amount(item: Item, reps = false): string {
  const each = item.each ? ` ${EACH_LABEL[item.each]}` : '';
  if (item.hold !== undefined) return `${duration(item.hold)}${item.easy ? ' hard' : ''}${each}`;
  const unit = item.unit ?? (reps ? 'reps' : '');
  return `${item.reps ?? 0}${unit ? ` ${unit}` : ''}${each}`;
}

/** "3 × 8 per leg · 1 min rest", "8 × 20 s hard · 70 s easy", "1 × 5 min". */
export function prescription(item: Item): string {
  const rest = item.sets > 1 && item.rest > 0 ? ` · ${duration(item.rest)} ${item.easy ? 'easy' : 'rest'}` : '';
  return `${item.sets} × ${amount(item)}${rest}`;
}

/** The rest to start once a bout is done: none between the two sides of a set, or after the last set. */
export function restAfter(item: Item, done: boolean[], bout: number): number {
  if (done.every(Boolean)) return 0;
  if (sidesPerSet(item) === 2 && bout % 2 === 0 && !done[bout + 1]) return 0;
  return item.rest;
}

/** Rough session length in minutes, rounded to 5: about 4 s a rep and 45 s to set up each exercise. */
export function minutes(session: Session): number {
  let seconds = 0;
  for (const item of session.items) {
    const sides = item.each ? 2 : 1;
    const work = item.hold !== undefined ? item.hold * sidesPerSet(item) : (item.reps ?? 0) * 4 * sides;
    seconds += item.sets * work + (item.sets - 1) * item.rest + 45;
  }
  return Math.max(5, Math.round(seconds / 300) * 5);
}

export function isLoaded(item: Item): boolean {
  return !!MOVES[item.move].load;
}

// ---------- calendar ----------

const DAY_MS = 86_400_000;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Local date as YYYY-MM-DD. */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole days from a to b (midnight to midnight, so daylight saving doesn't matter). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Monday of week 1: the taper week holds the day before the trip, and the plan runs back from it. */
export function planStart(trip = TRIP_DATE): Date {
  const lastDay = addDays(parseDate(trip), -1);
  const monday = addDays(lastDay, -((lastDay.getDay() + 6) % 7));
  return addDays(monday, -7 * (PLAN_WEEKS - 1));
}

/** First and last day of a plan week. The taper week ends the day before the trip. */
export function weekDates(week: number, trip = TRIP_DATE): { start: Date; end: Date } {
  const start = addDays(planStart(trip), 7 * (week - 1));
  let end = addDays(start, 6);
  const lastDay = addDays(parseDate(trip), -1);
  if (end > lastDay) end = lastDay;
  return { start, end };
}

/** The plan week a date falls in: 0 before the plan starts, PLAN_WEEKS + 1 from the trip on. */
export function weekOn(today: string, trip = TRIP_DATE): number {
  const day = parseDate(today);
  if (daysBetween(parseDate(trip), day) >= 0) return PLAN_WEEKS + 1;
  const days = daysBetween(planStart(trip), day);
  if (days < 0) return 0;
  return Math.min(PLAN_WEEKS, Math.floor(days / 7) + 1);
}

export function daysToTrip(today: string, trip = TRIP_DATE): number {
  return daysBetween(parseDate(today), parseDate(trip));
}

const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });

/** "2–8 Nov", "30 Nov – 6 Dec". */
export function rangeLabel(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth()) return `${start.getDate()}–${end.getDate()} ${month(end)}`;
  return `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)}`;
}

/** "Fri 25 Dec". */
export function dayLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
