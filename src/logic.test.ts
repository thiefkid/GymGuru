import { describe, expect, it } from 'vitest';
import { blockComplete, buildSession, exerciseResult, lastWeight, nextSlot, sessionStats, toCsv } from './logic';
import { program } from './program';
import { canRemoveWeek, currentSession, initialState, normalize, reducer, type State } from './store';

const NOW = 1_800_000_000_000;

function startLegs(week = 2): State {
  let s = initialState();
  s = reducer(s, { type: 'selectWeek', week });
  s = reducer(s, { type: 'selectDay', day: 'd3' });
  return reducer(s, { type: 'start', date: '2026-10-26' });
}

describe('program', () => {
  it('matches the W9-12 tab', () => {
    expect(program('d3', 1).map((e) => e.name)).toEqual([
      'High-stance Leg Press',
      'DB Bulgarian Split Squat',
      'Leg Curl',
      'Hip Adduction',
      'DB Flat Bench',
      'Lat Pulldown',
    ]);
    expect(program('d1', 2).some((e) => e.id === 'incline')).toBe(false);
    expect(program('d1', 3).some((e) => e.id === 'incline')).toBe(true);
    expect(program('d2', 1).find((e) => e.id === 'curlmachine')?.sets).toBe(4);
  });
});

describe('history', () => {
  it('uses the sheet weights as last time for week 2 legs', () => {
    expect(lastWeight({}, 2, 'd3', 'legpress')).toEqual({ weight: 40, week: 1, source: 'sheet' });
    expect(lastWeight({}, 2, 'd1', 'dip')).toBeNull();
  });

  it('pre-fills a new session with last week’s weights', () => {
    const session = buildSession({}, 2, 'd3', '2026-10-26');
    expect(session.exercises.legpress.sets).toEqual([
      { weight: '40', reps: 10, done: false },
      { weight: '40', reps: 10, done: false },
      { weight: '40', reps: 10, done: false },
    ]);
  });

  it('starts on the day after the last one logged', () => {
    expect(nextSlot({ 'w1:d3': 'sheet' })).toEqual({ week: 1, day: 'd4' });
    expect(nextSlot({ 'w1:d3': 'sheet', 'w1:d4': 'x' })).toEqual({ week: 2, day: 'd1' });
    expect(nextSlot({})).toEqual({ week: 1, day: 'd1' });
  });
});

describe('logging a workout', () => {
  it('completing a set starts the rest timer and carries the weight forward', () => {
    let s = startLegs();
    s = reducer(s, { type: 'setWeight', exerciseId: 'legpress', set: 0, value: '50' });
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 0, now: NOW });
    let sets = currentSession(s).exercises.legpress.sets;
    expect(sets[0].done).toBe(true);
    expect(sets.map((x) => x.weight)).toEqual(['50', '50', '50']);
    expect(s.restEnd).toBe(NOW + 120_000);

    // A completed set keeps its weight when an earlier set changes.
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 1, now: NOW });
    s = reducer(s, { type: 'setWeight', exerciseId: 'legpress', set: 0, value: '55' });
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 0, now: NOW });
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 0, now: NOW });
    sets = currentSession(s).exercises.legpress.sets;
    expect(sets.map((x) => x.weight)).toEqual(['55', '50', '55']);
  });

  it('rests only while the movement still has a set to go', () => {
    let s = startLegs();
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 0, now: NOW });
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 1, now: NOW + 1000 });
    expect(s.restEnd).toBe(NOW + 1000 + 120_000);
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 2, now: NOW + 2000 });
    expect(s.restEnd).toBeNull();
  });

  it('steps weight by 2.5 kg and never below zero', () => {
    let s = startLegs();
    s = reducer(s, { type: 'stepWeight', exerciseId: 'legpress', set: 0, delta: 1 });
    expect(currentSession(s).exercises.legpress.sets[0].weight).toBe('42.5');
    s = reducer(s, { type: 'setWeight', exerciseId: 'legpress', set: 0, value: '1' });
    s = reducer(s, { type: 'stepWeight', exerciseId: 'legpress', set: 0, delta: -1 });
    expect(currentSession(s).exercises.legpress.sets[0].weight).toBe('0');
  });

  it('summarises against last time and saving moves to the next day', () => {
    let s = startLegs();
    s = reducer(s, { type: 'fillWeight', exerciseId: 'legpress', value: '42.5' });
    for (let i = 0; i < 3; i++) s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: i, now: NOW });

    const session = currentSession(s);
    expect(sessionStats(session, 2, 'd3')).toMatchObject({ doneSets: 3, totalSets: 18, volume: 42.5 * 30, exercisesDone: 1 });
    expect(exerciseResult(session.exercises.legpress, lastWeight(s.logs, 2, 'd3', 'legpress'))).toMatchObject({
      top: 42.5,
      bestReps: 10,
      trend: 'up',
      delta: 2.5,
    });

    s = reducer(s, { type: 'save', now: '2026-10-26T10:00:00Z' });
    expect(s.saved['w2:d3']).toBe('2026-10-26T10:00:00Z');
    expect({ week: s.week, day: s.day, screen: s.screen }).toEqual({ week: 2, day: 'd4', screen: 'today' });
    // Next week's legs now use this session as "last time".
    expect(lastWeight(s.logs, 3, 'd3', 'legpress')).toEqual({ weight: 42.5, week: 2, source: 'app' });
  });

  it('exports completed sets as CSV', () => {
    let s = startLegs();
    s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: 0, now: NOW });
    s = reducer(s, { type: 'setRpe', exerciseId: 'legpress', rpe: 8 });
    expect(toCsv(s.logs)).toBe('date,week,day,exercise,set,weight_kg,reps,rpe\n2026-10-26,2,Legs,Leg Press,1,40,10,8\n');
  });
});

describe('extending the block', () => {
  it('repeats week 4 in added weeks', () => {
    const names = (day: 'd1' | 'd3' | 'd4', week: number) => program(day, week).map((e) => e.name);
    for (const day of ['d1', 'd3', 'd4'] as const) {
      expect(names(day, 5)).toEqual(names(day, 4));
      expect(names(day, 9)).toEqual(names(day, 4));
    }
    expect(names('d1', 5)).toContain('Incline Press Machine');
    expect(names('d1', 5)).not.toContain('Pause DB Flat Bench');
  });

  it('fills an added week with the previous week’s weights', () => {
    let s = reducer(initialState(), { type: 'addWeek' });
    s = reducer(s, { type: 'selectWeek', week: 4 });
    s = reducer(s, { type: 'selectDay', day: 'd3' });
    s = reducer(s, { type: 'start', date: '2026-11-01' });
    s = reducer(s, { type: 'setWeight', exerciseId: 'bss', set: 0, value: '40' });
    s = reducer(s, { type: 'toggleSet', exerciseId: 'bss', set: 0, now: NOW });
    expect(lastWeight(s.logs, 5, 'd3', 'bss')).toEqual({ weight: 40, week: 4, source: 'app' });
    s = reducer(s, { type: 'selectWeek', week: 5 });
    s = reducer(s, { type: 'start', date: '2026-11-08' });
    expect(currentSession(s).exercises.bss.sets.map((x) => x.weight)).toEqual(['40', '40', '40']);
  });

  it('moves on past the last week only once a week is added', () => {
    const all: Record<string, string> = {};
    for (let w = 1; w <= 4; w++) for (const d of ['d1', 'd2', 'd3', 'd4']) all[`w${w}:${d}`] = 'x';
    expect(nextSlot(all, 4)).toEqual({ week: 4, day: 'd4' });
    expect(blockComplete(all, 4)).toBe(true);
    expect(nextSlot(all, 5)).toEqual({ week: 5, day: 'd1' });
    expect(blockComplete(all, 5)).toBe(false);
  });

  it('adds weeks, and removes only empty added ones', () => {
    let s = reducer(initialState(), { type: 'addWeek' });
    expect({ weeks: s.weeks, week: s.week, day: s.day }).toEqual({ weeks: 5, week: 5, day: 'd1' });
    expect(canRemoveWeek(s)).toBe(true);
    expect(reducer(s, { type: 'removeWeek' })).toMatchObject({ weeks: 4, week: 4 });
    // Never below the sheet's 4 weeks.
    expect(reducer(initialState(), { type: 'removeWeek' }).weeks).toBe(4);
    // Not once something is logged in it.
    s = reducer(s, { type: 'start', date: '2026-11-01' });
    s = reducer(s, { type: 'toggleSet', exerciseId: 'dbbench', set: 0, now: NOW });
    expect(canRemoveWeek(s)).toBe(false);
    expect(reducer(s, { type: 'removeWeek' }).weeks).toBe(5);
  });

  it('makes room for weeks found in old saves and restores', () => {
    const old = { ...initialState(), weeks: undefined } as unknown as State;
    expect(normalize(old).weeks).toBe(4);
    const restored = reducer(initialState(), {
      type: 'restore',
      logs: { 'w6:d2': buildSession({}, 6, 'd2', '2026-11-10') },
      saved: { 'w6:d2': '2026-11-10T10:00:00.000Z' },
    });
    expect(restored.weeks).toBe(6);
    expect({ week: restored.week, day: restored.day }).toEqual({ week: 6, day: 'd3' });
  });
});
