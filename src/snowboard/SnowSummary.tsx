import type { Dispatch } from 'react';
import { Icon } from '../components/Icon';
import { Stat } from '../screens/Summary';
import { KNEE_ADVICE, KNEE_FEELS } from './guide';
import { MOVES } from './moves';
import { SESSION_LETTER, daysToTrip, isLoaded, isoDate, phaseOf } from './plan';
import { boutsOf, currentLog, currentSession, sessionStats, type SnowAction, type SnowState } from './store';

export function SnowSummary({ snow, snowDispatch }: { snow: SnowState; snowDispatch: Dispatch<SnowAction> }) {
  const session = currentSession(snow);
  const log = currentLog(snow);
  const stats = sessionStats(log, session);
  const today = isoDate(new Date());
  const days = Math.max(0, daysToTrip(today));
  const dateLabel = new Date(log.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="screen">
      <div className="scroll pad stack-lg">
        <div className="stack-md">
          <div className="done-badge">
            <Icon name="check" size={32} stroke={3} />
          </div>
          <p className="eyebrow">Session complete · {dateLabel}</p>
          <h1 className="display xxl">{session.name} done</h1>
          <p className="muted">
            Week {snow.week} · Session {SESSION_LETTER[session.id]} · {phaseOf(snow.week).name}
          </p>
        </div>

        <div className="grid-3">
          <Stat label="Sets" value={stats.done} of={stats.total} />
          <Stat label="Exercises" value={stats.exercisesDone} of={stats.exerciseCount} />
          <Stat label="Days to go" value={days} />
        </div>

        <section className="stack-sm">
          <h2 className="display md">How’s your right knee?</h2>
          <div className="feel-grid" role="group" aria-label="How your right knee feels">
            {KNEE_FEELS.map((f) => (
              <button key={f.id} className={`feel is-${f.id}`} aria-pressed={log.knee === f.id} onClick={() => snowDispatch({ type: 'knee', feel: f.id })}>
                <span className="strong">{f.label}</span>
                <span className="tiny-text feel-hint">{f.hint}</span>
              </button>
            ))}
          </div>
          <p className={log.knee ? 'small' : 'muted tiny-text'}>
            {log.knee ? KNEE_ADVICE[log.knee] : 'A quick check after every session, so the plan can tell you when to ease off.'}
          </p>
        </section>

        <section>
          <h2 className="display md section-head">Breakdown</h2>
          <ul className="plan">
            {session.items.map((item) => {
              const b = boutsOf(log, item);
              const n = b.filter(Boolean).length;
              const weight = isLoaded(item) && log.weight[item.move] ? ` · ${log.weight[item.move]} kg` : '';
              const unit = b.length === item.sets ? 'sets' : 'sides';
              return (
                <li key={item.move} className="plan-row">
                  <div className="grow stack-2">
                    <span className="strong">{MOVES[item.move].name}</span>
                    <span className="muted tiny-text">
                      {n}/{b.length} {unit}
                      {weight}
                    </span>
                  </div>
                  <span className={`trend ${n === b.length ? 'trend-up' : n ? 'trend-down' : ''}`}>{n === b.length ? 'Done' : n ? 'Part' : 'Skipped'}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="bottombar">
        <button className="primary" onClick={() => snowDispatch({ type: 'save', now: new Date().toISOString(), today: isoDate(new Date()) })}>
          Save session
        </button>
        <button className="text-btn" onClick={() => snowDispatch({ type: 'view', view: 'session' })}>
          Keep going
        </button>
      </div>
    </div>
  );
}
