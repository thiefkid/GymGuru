import type { Dispatch } from 'react';
import { Icon } from '../components/Icon';
import { exerciseResult, formatWeight, lastWeight, sessionStats } from '../logic';
import { DAYS, blockName, program } from '../program';
import { currentSession, type Action, type State } from '../store';

export function Summary({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const list = program(state.day, state.week);
  const day = DAYS.find((d) => d.id === state.day)!;
  const session = currentSession(state);
  const stats = sessionStats(session, state.week, state.day);
  const dateLabel = new Date(session.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="screen">
      <div className="scroll pad stack-lg">
        <div className="stack-md">
          <div className="done-badge">
            <Icon name="check" size={32} stroke={3} />
          </div>
          <p className="eyebrow">Workout complete · {dateLabel}</p>
          <h1 className="display xxl">{day.name} done</h1>
          <p className="muted">
            Week {state.week} · Day {day.n} of block {blockName(state.weeks)}
          </p>
        </div>

        <div className="grid-3">
          <Stat label="Sets" value={stats.doneSets} of={stats.totalSets} />
          <Stat label="Volume" value={Math.round(stats.volume).toLocaleString('en-GB')} unit="kg" />
          <Stat label="Exercises" value={stats.exercisesDone} of={stats.exerciseCount} />
        </div>

        <section>
          <h2 className="display md section-head">Breakdown</h2>
          <ul className="plan">
            {list.map((e) => {
              const log = session.exercises[e.id];
              const r = exerciseResult(log, lastWeight(state.logs, state.week, state.day, e.id));
              const best = r.top !== null ? `${formatWeight(r.top)} kg × ${r.bestReps}` : r.setsDone ? 'No weight entered' : 'Not done';
              const delta =
                r.trend === 'up'
                  ? `+${formatWeight(r.delta)} kg`
                  : r.trend === 'down'
                    ? `−${formatWeight(-r.delta)} kg`
                    : r.trend === 'same'
                      ? 'Same as last'
                      : r.trend === 'first'
                        ? 'First log'
                        : null;
              return (
                <li key={e.id} className="plan-row">
                  <div className="grow stack-2">
                    <span className="strong">{e.name}</span>
                    <span className="muted tiny-text">
                      {best} · {r.setsDone}/{log.sets.length} sets
                    </span>
                  </div>
                  {delta && <span className={`trend trend-${r.trend}`}>{delta}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="bottombar">
        <button className="primary" onClick={() => dispatch({ type: 'save', now: new Date().toISOString() })}>
          Save workout
        </button>
        <button className="text-btn" onClick={() => dispatch({ type: 'screen', screen: 'session' })}>
          Keep editing
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, of, unit }: { label: string; value: number | string; of?: number; unit?: string }) {
  return (
    <div className="stat">
      <span className="eyebrow tiny">{label}</span>
      <span className="display lg">
        {value}
        {of !== undefined && <span className="muted stat-of">/{of}</span>}
        {unit && <span className="muted stat-of"> {unit}</span>}
      </span>
    </div>
  );
}
