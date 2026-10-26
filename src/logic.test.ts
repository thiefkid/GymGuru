import { describe, expect, it } from 'vitest';
import { buildSession, exerciseResult, lastWeight, nextSlot, sessionStats, toCsv } from './logic';
import { program } from './program';
import { currentSession, initialState, reducer, type State } from './store';

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
