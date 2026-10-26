import { useEffect, useRef, useState, type Dispatch } from 'react';
import { beep, primeAudio } from '../beep';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { Icon } from '../components/Icon';
import { WEIGHT_STEP, formatClock, formatWeight, lastWeight, sessionStats } from '../logic';
import { DAYS, program, type Exercise } from '../program';
import { currentSession, type Action, type State } from '../store';

const RPE_OPTIONS = [6, 7, 8, 9, 10];

/** Re-renders every half second while a rest is running, and beeps and buzzes when it ends. */
function useRestClock(restEnd: number | null, dispatch: Dispatch<Action>) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!restEnd) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= restEnd) {
        // Only alert when the rest ran out just now, not when reopening the app long after.
        if (t - restEnd < 5000) {
          beep();
          navigator.vibrate?.([200, 100, 200]);
        }
        dispatch({ type: 'skipRest' });
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [restEnd, dispatch]);
  return restEnd ? Math.max(0, (restEnd - now) / 1000) : 0;
}

/** Keeps the phone screen awake during a workout, where supported. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      navigator.wakeLock
        ?.request('screen')
        .then((l) => (lock = l))
        .catch(() => {});
    };
    const onVisible = () => document.visibilityState === 'visible' && request();
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, []);
}

export function Session({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  useWakeLock();
  const restLeft = useRestClock(state.restEnd, dispatch);
  const chipRow = useRef<HTMLDivElement>(null);
  const [howTo, setHowTo] = useState<Exercise | null>(null);

  const list = program(state.day, state.week);
  const day = DAYS.find((d) => d.id === state.day)!;
  const session = currentSession(state);
  const stats = sessionStats(session, state.week, state.day);
  const index = Math.min(state.exerciseIndex, list.length - 1);
  const exercise = list[index];
  const log = session.exercises[exercise.id];
  const last = lastWeight(state.logs, state.week, state.day, exercise.id);
  const suggestion = last ? formatWeight(last.weight + WEIGHT_STEP) : null;
  const isLast = index === list.length - 1;

  useEffect(() => {
    chipRow.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [index]);

  const id = exercise.id;
  const progress = stats.totalSets ? (stats.doneSets / stats.totalSets) * 100 : 0;

  // The big button: log the next set and start the rest, or move on once the sets are done.
  const goNext = () => dispatch(isLast ? { type: 'screen', screen: 'summary' } : { type: 'goExercise', index: index + 1 });
  const nextSet = log.sets.findIndex((s) => !s.done);
  const lastSetOfExercise = log.sets.filter((s) => !s.done).length === 1;
  const main =
    nextSet < 0
      ? { label: isLast ? 'Finish workout' : 'Next exercise', detail: null, onClick: goNext }
      : {
          label: lastSetOfExercise ? (isLast ? 'Done · Finish' : 'Done · Next exercise') : `Done · Rest ${formatClock(exercise.rest)}`,
          detail: `Set ${nextSet + 1} of ${log.sets.length} · ${log.sets[nextSet].weight || '–'} kg × ${log.sets[nextSet].reps}`,
          onClick: () => {
            primeAudio();
            dispatch({ type: 'toggleSet', exerciseId: id, set: nextSet, now: Date.now() });
            if (lastSetOfExercise) goNext();
          },
        };

  return (
    <div className="screen">
      <header className="session-head">
        <div className="row gap-md center">
          <button className="icon-btn round" aria-label="Back to today" onClick={() => dispatch({ type: 'screen', screen: 'today' })}>
            <Icon name="back" />
          </button>
          <div className="grow">
            <p className="eyebrow tiny">
              Week {state.week} · Day {day.n}
            </p>
            <p className="display md tight">{day.name}</p>
          </div>
          <button className="pill-btn" onClick={() => dispatch({ type: 'screen', screen: 'summary' })}>
            Finish
          </button>
        </div>
        <div className="row gap-md center">
          <div className="progress" role="progressbar" aria-valuenow={stats.doneSets} aria-valuemin={0} aria-valuemax={stats.totalSets} aria-label="Sets completed">
            <div style={{ width: `${progress}%` }} />
          </div>
          <span className="muted tiny-text strong nums">
            {stats.doneSets}/{stats.totalSets} sets
          </span>
        </div>
        <div className="chips" ref={chipRow}>
          {list.map((e, i) => {
            const done = session.exercises[e.id]?.sets.every((s) => s.done);
            return (
              <button
                key={e.id}
                className="chip"
                aria-current={i === index ? 'step' : undefined}
                onClick={() => dispatch({ type: 'goExercise', index: i })}
              >
                <span className={`chip-mark ${done ? 'is-done' : ''}`}>{done ? <Icon name="check" size={12} stroke={3.5} /> : i + 1}</span>
                {e.name}
              </button>
            );
          })}
        </div>
      </header>

      <div className="scroll pad-session stack-lg">
        <section className="stack-md">
          <p className="eyebrow tiny">
            Exercise {index + 1} of {list.length}
          </p>
          <div className="row gap-sm center wrap">
            <h2 className="display xl">
              <button className="title-btn" onClick={() => setHowTo(exercise)}>
                {exercise.name}
                <span className="howto-pill">
                  <Icon name="play" size={10} stroke={2} />
                  How to
                </span>
              </button>
            </h2>
            {exercise.optional && <span className="tag">Optional</span>}
          </div>
          <div className="row gap-sm wrap">
            <span className="meta">{exercise.sets} sets</span>
            <span className="meta">{exercise.reps} reps</span>
            {exercise.rpe && <span className="meta">RPE {exercise.rpe}</span>}
            <span className="meta">Rest {formatClock(exercise.rest)}</span>
            {exercise.tempo && <span className="meta">Tempo {exercise.tempo}</span>}
          </div>
          {last ? (
            <div className="last-box">
              <div className="stack-xs">
                <span className="eyebrow tiny accent">Last time</span>
                <span className="display lg">{formatWeight(last.weight)} kg</span>
                <span className="muted tiny-text">
                  Week {last.week}
                  {last.variant ? ` · ${last.variant}` : ''}
                  {last.source === 'sheet' ? ' · from your sheet' : ''}
                </span>
              </div>
              <button className="accent-btn" onClick={() => dispatch({ type: 'fillWeight', exerciseId: id, value: suggestion! })}>
                Try {suggestion} kg
              </button>
            </div>
          ) : (
            <p className="empty-box">No weight logged for this yet. Enter what you lift today and it becomes next week’s target.</p>
          )}
        </section>

        <section className="stack-sm">
          <div className="set-grid set-head" aria-hidden="true">
            <span>Set</span>
            <span>kg</span>
            <span>Reps</span>
            <span>Done</span>
          </div>
          {log.sets.map((s, i) => {
            const n = i + 1;
            return (
              <div key={i} className={`set-grid set-row ${s.done ? 'is-done' : ''}`}>
                <span className="display md muted center-text">{n}</span>
                <div className="stepper wide">
                  <button aria-label={`Set ${n}: ${WEIGHT_STEP} kg less`} onClick={() => dispatch({ type: 'stepWeight', exerciseId: id, set: i, delta: -1 })}>
                    <Icon name="minus" size={16} stroke={2.4} />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Set ${n} weight in kilograms`}
                    placeholder="–"
                    value={s.weight}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => dispatch({ type: 'setWeight', exerciseId: id, set: i, value: e.target.value.replace(/[^\d.,]/g, '') })}
                  />
                  <button aria-label={`Set ${n}: ${WEIGHT_STEP} kg more`} onClick={() => dispatch({ type: 'stepWeight', exerciseId: id, set: i, delta: 1 })}>
                    <Icon name="plus" size={16} stroke={2.4} />
                  </button>
                </div>
                <div className="stepper">
                  <button aria-label={`Set ${n}: one rep fewer`} onClick={() => dispatch({ type: 'stepReps', exerciseId: id, set: i, delta: -1 })}>
                    <Icon name="minus" size={14} stroke={2.4} />
                  </button>
                  <span className="stepper-value nums" aria-label={`Set ${n} reps`}>
                    {s.reps}
                  </span>
                  <button aria-label={`Set ${n}: one rep more`} onClick={() => dispatch({ type: 'stepReps', exerciseId: id, set: i, delta: 1 })}>
                    <Icon name="plus" size={14} stroke={2.4} />
                  </button>
                </div>
                <button
                  className="done-btn"
                  aria-pressed={s.done}
                  aria-label={s.done ? `Undo set ${n}` : `Complete set ${n}`}
                  onClick={() => {
                    primeAudio();
                    dispatch({ type: 'toggleSet', exerciseId: id, set: i, now: Date.now() });
                  }}
                >
                  <Icon name="check" size={20} stroke={3} />
                </button>
              </div>
            );
          })}
        </section>

        <section className="stack-sm">
          <div className="row between baseline">
            <h3 className="strong">How hard was it?</h3>
            <span className="muted tiny-text">{exercise.rpe ? `Target RPE ${exercise.rpe}` : 'No target set'}</span>
          </div>
          <div className="rpe-grid">
            {RPE_OPTIONS.map((v) => (
              <button
                key={v}
                className={`rpe ${v === exercise.rpe ? 'is-target' : ''}`}
                aria-pressed={log.rpe === v}
                aria-label={`RPE ${v}`}
                onClick={() => dispatch({ type: 'setRpe', exerciseId: id, rpe: v })}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="muted tiny-text">RPE 10 = nothing left · 8 = two reps in the tank</p>
        </section>
      </div>

      <div className="bottombar">
        {state.restEnd && (
          <div className="rest" role="timer" aria-live="off">
            <span className="rest-icon">
              <Icon name="timer" size={26} stroke={2} />
            </span>
            <div className="grow">
              <p className="eyebrow tiny rest-label">Rest</p>
              <p className="display lg nums tight">{formatClock(restLeft)}</p>
            </div>
            <button className="ghost-btn" onClick={() => dispatch({ type: 'addRest', seconds: 30 })}>
              +30s
            </button>
            <button className="rest-skip" onClick={() => dispatch({ type: 'skipRest' })}>
              Skip
            </button>
          </div>
        )}
        <div className="row gap-md">
          <button
            className="icon-btn square"
            aria-label="Previous exercise"
            disabled={index === 0}
            onClick={() => dispatch({ type: 'goExercise', index: index - 1 })}
          >
            <Icon name="back" />
          </button>
          <button className={`primary grow ${main.detail ? 'stacked' : ''}`} onClick={main.onClick}>
            {main.detail && <span className="primary-detail nums">{main.detail}</span>}
            <span className="primary-label">
              {main.label}
              {!main.detail && <Icon name="next" stroke={2.6} />}
            </span>
          </button>
        </div>
      </div>

      <ExerciseSheet exercise={howTo} onClose={() => setHowTo(null)} />
    </div>
  );
}
