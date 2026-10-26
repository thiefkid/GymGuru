import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionRows } from './logic';
import { currentSession, initialState, reducer, type State } from './store';
import { connect, fetchFromSheet, isScriptUrl, pushSession } from './sync';
import { createFakeScript } from './test/appsScriptFake';

const URL_ = 'https://script.google.com/macros/s/AKfycbx_test-123/exec';
const KEY = 'a'.repeat(48);

function loggedLegs(): State {
  let s: State = { ...initialState(), sync: { ...initialState().sync, key: KEY, url: URL_ } };
  s = reducer(s, { type: 'selectWeek', week: 2 });
  s = reducer(s, { type: 'selectDay', day: 'd3' });
  s = reducer(s, { type: 'start', date: '2026-10-26' });
  s = reducer(s, { type: 'setWeight', exerciseId: 'legpress', set: 0, value: '42.5' });
  for (let i = 0; i < 3; i++) s = reducer(s, { type: 'toggleSet', exerciseId: 'legpress', set: i, now: 0 });
  s = reducer(s, { type: 'setRpe', exerciseId: 'legpress', rpe: 8 });
  s = reducer(s, { type: 'toggleSet', exerciseId: 'bss', set: 0, now: 0 });
  return reducer(s, { type: 'save', now: '2026-10-26T10:00:00.000Z' });
}

describe('Apps Script (Code.gs)', () => {
  it('lets the first key claim the script and refuses others', () => {
    const script = createFakeScript();
    expect(script.post({ action: 'ping', key: 'short' })).toEqual({ ok: false, error: 'Missing sync key' });
    expect(script.post({ action: 'ping', key: KEY })).toEqual({ ok: true, sheet: 'shawn' });
    expect(script.props.get('SYNC_KEY')).toBe(KEY);
    expect(script.post({ action: 'ping', key: 'b'.repeat(48) })).toEqual({ ok: false, error: 'Wrong sync key' });
    expect(script.get({ action: 'ping', key: KEY })).toEqual({ ok: true, sheet: 'shawn' });
    expect(script.post('not json')).toEqual({ ok: false, error: 'Bad request' });
  });

  it('writes one row per set and replaces a day when it is saved again', () => {
    const script = createFakeScript();
    const session = (key: string, weight: number) => ({
      key,
      date: '2026-10-26',
      week: 2,
      day: 'Legs',
      savedAt: '2026-10-26T10:00:00.000Z',
      rows: [
        { exerciseId: 'legpress', exercise: 'Leg Press', set: 1, weight, reps: 10, rpe: 8 },
        { exerciseId: 'legpress', exercise: 'Leg Press', set: 2, weight, reps: 9, rpe: 8 },
      ],
    });
    script.post({ action: 'save', key: KEY, session: session('w2:d3', 40) });
    script.post({ action: 'save', key: KEY, session: session('w2:d4', 20) });
    expect(script.post({ action: 'save', key: KEY, session: session('w2:d3', 45) })).toEqual({ ok: true, rows: 2 });

    const log = script.log();
    expect(log[0]).toEqual(['Session', 'Date', 'Week', 'Day', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'RPE', 'Exercise ID', 'Saved at']);
    expect(log.slice(1).map((r) => [r[0], r[6]])).toEqual([
      ['w2:d4', 20],
      ['w2:d4', 20],
      ['w2:d3', 45],
      ['w2:d3', 45],
    ]);
  });

  it('rejects malformed sessions and strips formula-like text', () => {
    const script = createFakeScript();
    expect(script.post({ action: 'save', key: KEY, session: { key: 'oops', date: '2026-10-26', rows: [] } })).toEqual({ ok: false, error: 'Bad session' });
    script.post({
      action: 'save',
      key: KEY,
      session: { key: 'w1:d1', date: '2026-10-26', week: 1, day: '=HYPERLINK("x")', savedAt: '', rows: [{ exerciseId: 'dip', exercise: '+cmd', set: 1, weight: 'x', reps: 8, rpe: '' }] },
    });
    const row = script.log()[1];
    expect(row[3]).toBe('HYPERLINK("x")');
    expect(row[4]).toBe('cmd');
    expect(row[6]).toBe('');
  });
});

describe('app ↔ sheet', () => {
  let script: ReturnType<typeof createFakeScript>;

  beforeEach(() => {
    script = createFakeScript();
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      expect(url).toBe(URL_);
      expect(init.headers).toEqual({ 'Content-Type': 'text/plain;charset=utf-8' });
      return { json: async () => script.post(String(init.body)) };
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('accepts only deployed web app URLs', () => {
    expect(isScriptUrl(URL_)).toBe(true);
    expect(isScriptUrl('https://script.google.com/macros/s/abc/dev')).toBe(false);
    expect(isScriptUrl('https://evil.example/macros/s/abc/exec')).toBe(false);
  });

  it('pushes a saved workout and restores it on a fresh phone', async () => {
    expect(await connect(URL_, KEY)).toBe('shawn');
    const phone = loggedLegs();
    expect(phone.sync.queue).toEqual(['w2:d3']);
    await pushSession(phone, 'w2:d3');
    expect(script.log()).toHaveLength(1 + 4);

    // New phone with the same key: restore from the sheet.
    let fresh: State = { ...initialState(), sync: { ...initialState().sync, key: KEY, url: URL_ } };
    const restored = await fetchFromSheet(fresh);
    fresh = reducer(fresh, { type: 'restore', ...restored });

    expect(fresh.saved['w2:d3']).toBe('2026-10-26T10:00:00.000Z');
    const before = phone.logs['w2:d3'];
    const after = fresh.logs['w2:d3'];
    expect(after.date).toBe('2026-10-26');
    expect(sessionRows(2, 'd3', after)).toEqual(sessionRows(2, 'd3', before));
    expect(after.exercises.legpress.rpe).toBe(8);
    // Sets that weren't done come back open, pre-filled with the last weight.
    expect(after.exercises.bss.sets.map((s) => s.done)).toEqual([true, false, false]);
    // Restoring moves "today" past the restored day.
    expect({ week: fresh.week, day: fresh.day }).toEqual({ week: 2, day: 'd4' });
  });

  it('reports a key the script does not accept', async () => {
    await connect(URL_, KEY);
    await expect(connect(URL_, 'b'.repeat(48))).rejects.toThrow(/another phone’s sync key/);
  });

  it('keeps sync state in the queue until the sheet confirms', () => {
    let s = loggedLegs();
    s = reducer(s, { type: 'syncError', error: 'offline' });
    expect(s.sync.queue).toEqual(['w2:d3']);
    s = reducer(s, { type: 'syncDone', key: 'w2:d3', at: 'now' });
    expect(s.sync).toMatchObject({ queue: [], lastSynced: 'now', error: null });
    // Connecting queues every workout logged in the app, but not the sheet's imported week 1.
    s = reducer(s, { type: 'syncConnect', url: URL_, sheetName: 'shawn' });
    expect(s.sync.queue).toEqual(['w2:d3']);
    expect(currentSession(s)).toBeDefined();
  });
});
