import { useState, type Dispatch } from 'react';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { Icon } from '../components/Icon';
import { TabBar } from '../components/TabBar';
import { formatWeight, hasProgress, lastWeight, sessionKey } from '../logic';
import { BLOCK_NAME, DAYS, WEEKS, program, type Exercise } from '../program';
import { currentKey, today, type Action, type State } from '../store';

export function Today({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [howTo, setHowTo] = useState<Exercise | null>(null);
  const list = program(state.day, state.week);
  const day = DAYS.find((d) => d.id === state.day)!;
  const totalSets = list.reduce((n, e) => n + e.sets, 0);
  const key = currentKey(state);
  const label = state.saved[key] ? 'Redo' : hasProgress(state.logs[key]) ? 'Resume' : 'Start';
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="screen">
      <div className="scroll pad stack-lg">
        <header className="row between start">
          <div className="stack-xs">
            <p className="eyebrow">{dateLabel}</p>
            <h1 className="display xl">Let’s train</h1>
            {state.sync.url && (state.sync.queue.length > 0 || state.sync.error) && (
              <button className="sync-note" onClick={() => dispatch({ type: 'screen', screen: 'settings' })}>
                {state.sync.error ? 'Sheet sync problem · tap to see' : `${state.sync.queue.length} waiting to sync to your sheet`}
              </button>
            )}
          </div>
          <button className="icon-btn" aria-label="Settings and backup" onClick={() => dispatch({ type: 'screen', screen: 'settings' })}>
            <Icon name="settings" size={20} stroke={1.8} />
          </button>
        </header>

        <section className="stack-sm">
          <div className="row between baseline">
            <h2 className="eyebrow">Block {BLOCK_NAME}</h2>
            <span className="muted small">Week {state.week} of {WEEKS.length}</span>
          </div>
          <div className="row gap-sm">
            {WEEKS.map((w) => {
              const logged = DAYS.filter((d) => state.saved[sessionKey(w, d.id)]).length;
              return (
                <button
                  key={w}
                  className="week-pill"
                  aria-pressed={w === state.week}
                  onClick={() => dispatch({ type: 'selectWeek', week: w })}
                >
                  <span className="display md">W{w}</span>
                  <span className="week-sub">{logged}/4 days</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid-2">
          {DAYS.map((d) => {
            const k = sessionKey(state.week, d.id);
            const saved = !!state.saved[k];
            const started = hasProgress(state.logs[k]);
            const status = saved ? 'Logged' : started ? 'In progress' : `${program(d.id, state.week).length} exercises`;
            return (
              <button
                key={d.id}
                className="day-card"
                aria-pressed={d.id === state.day}
                onClick={() => dispatch({ type: 'selectDay', day: d.id })}
              >
                <span className="eyebrow tiny">Day {d.n}</span>
                <span className="display lg">{d.name}</span>
                <span className="muted tiny-text">{d.focus}</span>
                <span className={`day-status ${saved ? 'is-saved' : started ? 'is-started' : ''}`}>
                  {saved && <Icon name="check" size={14} stroke={3} />}
                  {status}
                </span>
              </button>
            );
          })}
        </section>

        <section>
          <div className="row between baseline section-head">
            <h2 className="display md">{day.name} plan</h2>
            <span className="muted small">
              {list.length} exercises · {totalSets} sets
            </span>
          </div>
          <p className="muted tiny-text plan-hint">
            <Icon name="play" size={10} stroke={2} /> Tap a movement to see how it’s done.
          </p>
          <ol className="plan">
            {list.map((e, i) => {
              const last = lastWeight(state.logs, state.week, state.day, e.id);
              return (
                <li key={e.id}>
                  <button className="plan-row plan-btn" onClick={() => setHowTo(e)} aria-label={`${e.name}: how to do it`}>
                    <span className="plan-num">{i + 1}</span>
                    <span className="grow stack-2">
                      <span className="strong">
                        {e.name}
                        {e.optional && <span className="tag">Optional</span>}
                      </span>
                      <span className="muted tiny-text">
                        {e.sets} × {e.reps}
                        {e.rpe ? ` · RPE ${e.rpe}` : ''} · {e.rest / 60} min rest
                      </span>
                    </span>
                    <span className="plan-last">
                      <span className="display sm">{last ? `${formatWeight(last.weight)} kg` : '—'}</span>
                      <span className="muted tiny-text">{last ? `Week ${last.week}` : 'no history'}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="bottombar">
        <button className="primary" onClick={() => dispatch({ type: 'start', date: today() })}>
          <Icon name="play" size={18} stroke={2} />
          {label} {day.name}
        </button>
        <TabBar screen={state.screen} dispatch={dispatch} />
      </div>

      <ExerciseSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  );
}
