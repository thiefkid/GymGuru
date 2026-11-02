import { describe, expect, it } from 'vitest';
import { MOVES, RIDE_VIDEOS } from './moves';
import {
  PLAN_WEEKS,
  amount,
  bouts,
  daysToTrip,
  isoDate,
  minutes,
  planStart,
  prescription,
  rangeLabel,
  restAfter,
  sessionFor,
  sessionsFor,
  totalSessions,
  weekDates,
  weekOn,
  type Item,
} from './plan';
import { boutsOf, currentLog, currentSession, initialSnow, lastKnee, lastWeight, normalizeSnow, snowReducer, suggestedSlot, type SnowState } from './store';

const TODAY = '2026-11-02';
const NOW = 1_800_000_000_000;

const allSessions = Array.from({ length: PLAN_WEEKS }, (_, i) => sessionsFor(i + 1)).flat();

function itemIn(state: SnowState, move: string): Item {
  return currentSession(state).items.find((i) => i.move === move)!;
}

function startWeek1(session: 'a' | 'b' | 'c' = 'a'): SnowState {
  const s = snowReducer(initialSnow(TODAY), { type: 'select', week: 1, session });
  return snowReducer(s, { type: 'start', date: TODAY });
}

describe('snowboard plan', () => {
  it('has 3 sessions a week and 2 light ones in the taper week', () => {
    for (let w = 1; w < PLAN_WEEKS; w++) expect(sessionsFor(w).map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(sessionsFor(PLAN_WEEKS).map((s) => s.id)).toEqual(['a', 'b']);
    expect(totalSessions()).toBe(23);
  });

  it('starts every session with the knee-friendly warm-up', () => {
    for (const s of allSessions) {
      expect(s.items.slice(0, 4).map((i) => i.move)).toEqual(['bike', 'tke', 'bandwalk', 'hip9090']);
    }
  });

  it('gives every movement sets and either reps or a time, once per session', () => {
    for (const s of allSessions) {
      const moves = s.items.map((i) => i.move);
      expect(new Set(moves).size, s.name).toBe(moves.length);
      for (const item of s.items) {
        expect(item.sets, item.move).toBeGreaterThanOrEqual(1);
        expect((item.reps ?? 0) > 0 !== (item.hold ?? 0) > 0, item.move).toBe(true);
      }
    }
  });

  it('builds up week by week, then tapers', () => {
    const hold = (week: number, session: 'a' | 'b' | 'c', move: string) => sessionFor(week, session)!.items.find((i) => i.move === move)?.hold;
    expect([1, 2, 3, 4, 5, 6, 7].map((w) => hold(w, 'c', 'wallsit'))).toEqual([30, 40, 45, 50, 60, 75, 90]);
    expect(sessionFor(1, 'a')!.items.find((i) => i.move === 'boxsquat')).toMatchObject({ sets: 3, reps: 10 });
    expect(sessionFor(2, 'a')!.items.find((i) => i.move === 'boxsquat')).toMatchObject({ sets: 3, reps: 12 });
    expect(sessionFor(8, 'a')!.items.find((i) => i.move === 'gobletsquat')).toMatchObject({ sets: 2, reps: 6 });
    // Jumps only once the knee has had two weeks of groundwork.
    for (const w of [1, 2]) for (const s of sessionsFor(w)) expect(s.items.some((i) => i.move === 'boxjump' || i.move === 'skater')).toBe(false);
  });

  it('has a video, form tips and a reason for every movement, and no unused ones', () => {
    const used = new Set(allSessions.flatMap((s) => s.items.map((i) => i.move)));
    expect(Object.keys(MOVES).filter((id) => !used.has(id as keyof typeof MOVES))).toEqual([]);
    for (const [id, move] of Object.entries(MOVES)) {
      expect(move.video, id).toMatch(/^[\w-]{11}$/);
      expect(move.cues.length, id).toBeGreaterThanOrEqual(3);
      expect(move.why, id).not.toBe('');
      expect(move.search, id).not.toBe('');
    }
    for (const v of RIDE_VIDEOS) expect(v.video, v.name).toMatch(/^[\w-]{11}$/);
  });

  it('describes each prescription', () => {
    const item = (extra: Partial<Item>): Item => ({ move: 'stepup', block: 'Legs', sets: 3, rest: 60, ...extra });
    expect(prescription(item({ reps: 8, each: 'leg' }))).toBe('3 × 8 per leg · 1 min rest');
    expect(prescription(item({ move: 'intervals', sets: 8, hold: 20, rest: 70, easy: true }))).toBe('8 × 20 s hard · 70 s easy');
    expect(prescription(item({ move: 'bike', sets: 1, hold: 300, rest: 0 }))).toBe('1 × 5 min');
    expect(amount(item({ reps: 10, unit: 'steps', each: 'way' }))).toBe('10 steps each way');
    expect(amount(item({ reps: 8, each: 'leg' }))).toBe('8 per leg');
    expect(amount(item({ reps: 8, each: 'leg' }), true)).toBe('8 reps per leg');
    expect(amount(item({ reps: 5, unit: 'falls' }), true)).toBe('5 falls');
    expect(amount(item({ hold: 90 }))).toBe('90 s');
    expect(amount(item({ hold: 20, each: 'side' }))).toBe('20 s per side');
  });

  it('times each side of a timed set and rests only once both are done', () => {
    const plank: Item = { move: 'sideplank', block: 'Core', sets: 3, hold: 20, each: 'side', rest: 30 };
    expect(bouts(plank)).toBe(6);
    expect(restAfter(plank, [true, false, false, false, false, false], 0)).toBe(0);
    expect(restAfter(plank, [true, true, false, false, false, false], 1)).toBe(30);
    expect(restAfter(plank, [true, true, true, true, true, true], 5)).toBe(0);
    // Rep sets on each leg are one set: both legs, then rest.
    expect(bouts({ move: 'stepup', block: 'Legs', sets: 3, reps: 8, each: 'leg', rest: 60 })).toBe(3);
  });

  it('keeps every session to about 30–60 minutes', () => {
    for (const s of allSessions) expect(minutes(s), s.name).toBeGreaterThanOrEqual(25);
    for (const s of allSessions) expect(minutes(s), s.name).toBeLessThanOrEqual(60);
  });
});

describe('snowboard calendar', () => {
  it('counts the weeks back from the trip on 25 December', () => {
    expect(isoDate(planStart())).toBe(TODAY);
    expect(['2026-11-01', '2026-11-02', '2026-11-08', '2026-11-09', '2026-12-20', '2026-12-21', '2026-12-24', '2026-12-25'].map((d) => weekOn(d))).toEqual([
      0, 1, 1, 2, 7, 8, 8, 9,
    ]);
    expect(daysToTrip(TODAY)).toBe(53);
    const taper = weekDates(8);
    expect([isoDate(taper.start), isoDate(taper.end)]).toEqual(['2026-12-21', '2026-12-24']);
    expect(rangeLabel(weekDates(1).start, weekDates(1).end)).toBe('2–8 Nov');
    expect(rangeLabel(weekDates(5).start, weekDates(5).end)).toBe('30 Nov – 6 Dec');
  });

  it('puts the taper in the week before a trip that starts on a Monday', () => {
    const trip = '2027-01-04';
    expect(isoDate(weekDates(8, trip).start)).toBe('2026-12-28');
    expect(isoDate(weekDates(8, trip).end)).toBe('2027-01-03');
    expect(weekOn('2027-01-03', trip)).toBe(8);
  });
});

describe('snowboard sessions', () => {
  it('opens on the next session of the current week', () => {
    expect(initialSnow(TODAY)).toMatchObject({ week: 1, session: 'a', view: 'plan' });
    expect(suggestedSlot({ 'w1:a': 'x' }, '2026-11-04')).toEqual({ week: 1, session: 'b' });
    // Missed sessions in past weeks aren't made up.
    expect(suggestedSlot({}, '2026-11-18')).toEqual({ week: 3, session: 'a' });
    // A finished week moves on to the next one.
    expect(suggestedSlot({ 'w1:a': 'x', 'w1:b': 'x', 'w1:c': 'x' }, '2026-11-07')).toEqual({ week: 2, session: 'a' });
    expect(suggestedSlot({}, '2026-12-28')).toEqual({ week: 8, session: 'a' });
  });

  it('logs sets with a rest between them and none after the last', () => {
    let s = startWeek1();
    expect(s.view).toBe('session');
    expect(s.index).toBe(0);
    for (let set = 0; set < 3; set++) {
      s = snowReducer(s, { type: 'toggle', move: 'boxsquat', bout: set, now: NOW + set });
      expect(s.restEnd).toBe(set < 2 ? NOW + set + 90_000 : null);
    }
    expect(boutsOf(currentLog(s), itemIn(s, 'boxsquat'))).toEqual([true, true, true]);
    // Unticking a set leaves the rest alone.
    s = snowReducer(s, { type: 'toggle', move: 'boxsquat', bout: 2, now: NOW });
    expect(boutsOf(currentLog(s), itemIn(s, 'boxsquat'))).toEqual([true, true, false]);
  });

  it('times holds one side at a time', () => {
    let s = startWeek1();
    s = snowReducer(s, { type: 'startHold', move: 'sideplank', bout: 0, now: NOW });
    expect(s.hold).toEqual({ move: 'sideplank', bout: 0, end: NOW + 20_000 });
    s = snowReducer(s, { type: 'endHold', now: NOW + 20_000 });
    expect(s.hold).toBeNull();
    // Straight on to the other side, then the rest.
    expect(s.restEnd).toBeNull();
    s = snowReducer(s, { type: 'startHold', move: 'sideplank', bout: 1, now: NOW + 25_000 });
    s = snowReducer(s, { type: 'endHold', now: NOW + 30_000 });
    expect(s.restEnd).toBe(NOW + 30_000 + 30_000);
    expect(boutsOf(currentLog(s), itemIn(s, 'sideplank')).slice(0, 2)).toEqual([true, true]);
    // A hold that ran out while the app was closed counts from when it ended.
    s = snowReducer(s, { type: 'toggle', move: 'sideplank', bout: 2, now: NOW + 60_000 });
    s = snowReducer(s, { type: 'startHold', move: 'sideplank', bout: 3, now: NOW + 100_000 });
    s = snowReducer(s, { type: 'endHold', now: NOW + 900_000 });
    expect(boutsOf(currentLog(s), itemIn(s, 'sideplank')).slice(0, 4)).toEqual([true, true, true, true]);
    expect(s.restEnd).toBe(NOW + 120_000 + 30_000);
    // Stopping a hold doesn't count it.
    s = snowReducer(s, { type: 'startHold', move: 'sideplank', bout: 4, now: NOW });
    s = snowReducer(s, { type: 'cancelHold' });
    expect(boutsOf(currentLog(s), itemIn(s, 'sideplank'))[4]).toBe(false);
    // Only timed movements have a hold.
    expect(snowReducer(s, { type: 'startHold', move: 'boxsquat', bout: 0, now: NOW }).hold).toBeNull();
  });

  it('starts the next time a movement comes up from the weight last used', () => {
    let s = startWeek1();
    s = snowReducer(s, { type: 'setWeight', move: 'boxsquat', value: '12' });
    s = snowReducer(s, { type: 'stepWeight', move: 'boxsquat', delta: 1 });
    expect(currentLog(s).weight.boxsquat).toBe('14.5');
    // A weight only counts once a set was done with it.
    expect(lastWeight(s.logs, 2, 'a', 'boxsquat')).toBeNull();
    s = snowReducer(s, { type: 'toggle', move: 'boxsquat', bout: 0, now: NOW });
    s = snowReducer(s, { type: 'save', now: '2026-11-02T18:00:00.000Z', today: TODAY });
    expect(lastWeight(s.logs, 2, 'a', 'boxsquat')).toEqual({ weight: 14.5, week: 1 });
    s = snowReducer(s, { type: 'select', week: 2, session: 'a' });
    s = snowReducer(s, { type: 'start', date: '2026-11-09' });
    expect(currentLog(s).weight.boxsquat).toBe('14.5');
  });

  it('saves with a knee check and moves on to the next session', () => {
    let s = startWeek1();
    s = snowReducer(s, { type: 'view', view: 'summary' });
    s = snowReducer(s, { type: 'knee', feel: 'sore' });
    s = snowReducer(s, { type: 'save', now: '2026-11-02T18:00:00.000Z', today: TODAY });
    expect(s.saved['w1:a']).toBe('2026-11-02T18:00:00.000Z');
    expect({ view: s.view, week: s.week, session: s.session }).toEqual({ view: 'plan', week: 1, session: 'b' });
    expect(lastKnee(s)).toEqual({ feel: 'sore', week: 1, session: 'a' });
    // The latest saved session decides.
    s = snowReducer(s, { type: 'start', date: '2026-11-04' });
    s = snowReducer(s, { type: 'knee', feel: 'good' });
    s = snowReducer(s, { type: 'save', now: '2026-11-04T18:00:00.000Z', today: '2026-11-04' });
    expect(lastKnee(s)?.feel).toBe('good');
  });

  it('resumes a session after a reload, otherwise opens on the suggested one', () => {
    const inSession = startWeek1('b');
    expect(normalizeSnow(inSession, TODAY)).toBe(inSession);
    expect(normalizeSnow({ ...inSession, view: 'plan', week: 5 }, TODAY)).toMatchObject({ view: 'plan', week: 1, session: 'a' });
    // Week 8 has no session C.
    expect(normalizeSnow({ ...inSession, week: 8, session: 'c' }, TODAY)).toMatchObject({ view: 'plan', week: 1 });
  });

  it('starts over', () => {
    let s = startWeek1();
    s = snowReducer(s, { type: 'toggle', move: 'boxsquat', bout: 0, now: NOW });
    s = snowReducer(s, { type: 'save', now: '2026-11-02T18:00:00.000Z', today: TODAY });
    expect(snowReducer(s, { type: 'reset', today: TODAY })).toEqual(initialSnow(TODAY));
  });
});
