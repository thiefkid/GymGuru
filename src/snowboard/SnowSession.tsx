import { useEffect, useRef, useState, type Dispatch } from 'react';
import { primeAudio } from '../beep';
import { HowToSheet, type HowTo } from '../components/ExerciseSheet';
import { Icon } from '../components/Icon';
import { timeUp, useCountdown, useWakeLock } from '../hooks';
import { WEIGHT_STEP, formatClock, formatWeight } from '../logic';
import { howToFor } from './guide';
import { MOVES } from './moves';
import { SESSION_LETTER, amount, boutInfo, duration, isLoaded, sidesPerSet, type Item } from './plan';
import { boutsOf, currentLog, currentSession, lastWeight, sessionStats, type SnowAction, type SnowState } from './store';

function sideName(item: Item, side: 'Right' | 'Left' | null): string {
  return side ? `${side} ${item.each === 'leg' ? 'leg' : 'side'}` : '';
}

export function SnowSession({ snow, snowDispatch }: { snow: SnowState; snowDispatch: Dispatch<SnowAction> }) {
  useWakeLock();
  const restLeft = useCountdown(snow.restEnd, (fresh) => {
    if (fresh) timeUp();
    snowDispatch({ type: 'skipRest' });
  });
  const holdLeft = useCountdown(snow.hold?.end ?? null, (fresh) => {
    if (fresh) timeUp();
    snowDispatch({ type: 'endHold', now: Date.now() });
  });
  const chipRow = useRef<HTMLDivElement>(null);
  const [howTo, setHowTo] = useState<HowTo | null>(null);

  const session = currentSession(snow);
  const log = currentLog(snow);
  const stats = sessionStats(log, session);
  const index = Math.min(snow.index, session.items.length - 1);
  const item = session.items[index];
  const move = MOVES[item.move];
  const done = boutsOf(log, item);
  const isLast = index === session.items.length - 1;
  const loaded = isLoaded(item);
  const weight = log.weight[item.move] ?? '';
  const last = loaded ? lastWeight(snow.logs, snow.week, session.id, item.move) : null;
  const held = snow.hold ? session.items.find((i) => i.move === snow.hold!.move) : undefined;
  const holdingHere = !!snow.hold && snow.hold.move === item.move;

  useEffect(() => {
    chipRow.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [index]);

  const progress = stats.total ? (stats.done / stats.total) * 100 : 0;
  const goNext = () => snowDispatch(isLast ? { type: 'view', view: 'summary' } : { type: 'go', index: index + 1 });
  const next = done.findIndex((d) => !d);
  const lastBout = done.filter((d) => !d).length === 1;
  const kg = loaded && weight ? ` · ${weight} kg` : '';

  // The big button: start a timed set, log a set and rest, or move on once the sets are done.
  let main: { label: string; detail: string | null; onClick: () => void };
  if (holdingHere) {
    main = { label: 'Done early', detail: null, onClick: () => snowDispatch({ type: 'endHold', now: Date.now() }) };
  } else if (next < 0) {
    main = { label: isLast ? 'Finish session' : 'Next exercise', detail: null, onClick: goNext };
  } else if (item.hold !== undefined) {
    const { set, side } = boutInfo(item, next);
    main = {
      label: `Start · ${formatClock(item.hold)}`,
      detail: `Set ${set} of ${item.sets}${side ? ` · ${sideName(item, side)}` : ''}${kg}`,
      onClick: () => {
        primeAudio();
        snowDispatch({ type: 'startHold', move: item.move, bout: next, now: Date.now() });
      },
    };
  } else {
    main = {
      label: lastBout ? (isLast ? 'Done · Finish' : 'Done · Next exercise') : item.rest ? `Done · Rest ${formatClock(item.rest)}` : 'Done · Next set',
      detail: `Set ${next + 1} of ${item.sets} · ${amount(item, true)}${kg}`,
      onClick: () => {
        primeAudio();
        snowDispatch({ type: 'toggle', move: item.move, bout: next, now: Date.now() });
        if (lastBout) goNext();
      },
    };
  }

  const holdSide = snow.hold && held ? boutInfo(held, snow.hold.bout).side : null;

  return (
    <div className="screen">
      <header className="session-head">
        <div className="row gap-md center">
          <button className="icon-btn round" aria-label="Back to the plan" onClick={() => snowDispatch({ type: 'view', view: 'plan' })}>
            <Icon name="back" />
          </button>
          <div className="grow">
            <p className="eyebrow tiny">
              Week {snow.week} · Session {SESSION_LETTER[session.id]}
            </p>
            <p className="display md tight">{session.name}</p>
          </div>
          <button className="pill-btn" onClick={() => snowDispatch({ type: 'view', view: 'summary' })}>
            Finish
          </button>
        </div>
        <div className="row gap-md center">
          <div className="progress" role="progressbar" aria-valuenow={stats.done} aria-valuemin={0} aria-valuemax={stats.total} aria-label="Sets completed">
            <div style={{ width: `${progress}%` }} />
          </div>
          <span className="muted tiny-text strong nums">
            {stats.done}/{stats.total} sets
          </span>
        </div>
        <div className="chips" ref={chipRow}>
          {session.items.map((it, i) => {
            const complete = boutsOf(log, it).every(Boolean);
            return (
              <button key={it.move} className="chip" aria-current={i === index ? 'step' : undefined} onClick={() => snowDispatch({ type: 'go', index: i })}>
                <span className={`chip-mark ${complete ? 'is-done' : ''}`}>{complete ? <Icon name="check" size={12} stroke={3.5} /> : i + 1}</span>
                {MOVES[it.move].name}
              </button>
            );
          })}
        </div>
      </header>

      <div className="scroll pad-session stack-lg">
        <section className="stack-md">
          <p className="eyebrow tiny">
            {item.block} · exercise {index + 1} of {session.items.length}
          </p>
          <h2 className="display xl">
            <button className="title-btn" onClick={() => setHowTo(howToFor(item))}>
              {move.name}
              <span className="howto-pill">
                <Icon name="play" size={10} stroke={2} />
                How to
              </span>
            </button>
          </h2>
          <div className="row gap-sm wrap">
            <span className="meta">
              {item.sets} {item.sets === 1 ? 'set' : 'sets'}
            </span>
            <span className="meta">{amount(item, true)}</span>
            {item.sets > 1 && item.rest > 0 && (
              <span className="meta">
                {item.easy ? 'Easy' : 'Rest'} {formatClock(item.rest)}
              </span>
            )}
          </div>
          {item.note && (
            <p className="note-box">
              <b>This week:</b> {item.note}
            </p>
          )}
          {move.knee && (
            <p className="note-box knee-note">
              <b>Right knee:</b> {move.knee}
            </p>
          )}
        </section>

        {loaded && (
          <section className="weight-box">
            <div className="stack-xs grow">
              <span className="eyebrow tiny accent">Weight</span>
              <span className="muted tiny-text">{last ? `Last time ${formatWeight(last.weight)} kg · week ${last.week}` : 'Log what you use; next time starts from it.'}</span>
            </div>
            <div className="stepper wide weight-stepper">
              <button aria-label={`${WEIGHT_STEP} kg less`} onClick={() => snowDispatch({ type: 'stepWeight', move: item.move, delta: -1 })}>
                <Icon name="minus" size={16} stroke={2.4} />
              </button>
              <input
                type="text"
                inputMode="decimal"
                aria-label="Weight in kilograms"
                placeholder="kg"
                value={weight}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => snowDispatch({ type: 'setWeight', move: item.move, value: e.target.value.replace(/[^\d.,]/g, '') })}
              />
              <button aria-label={`${WEIGHT_STEP} kg more`} onClick={() => snowDispatch({ type: 'stepWeight', move: item.move, delta: 1 })}>
                <Icon name="plus" size={16} stroke={2.4} />
              </button>
            </div>
          </section>
        )}

        <section className="stack-sm">
          {done.map((isDone, b) => {
            const { set, side } = boutInfo(item, b);
            const label = side ? `Set ${set} · ${sideName(item, side)}` : `Set ${set}`;
            const work = sidesPerSet(item) === 2 ? duration(item.hold!) : amount(item, true);
            const active = holdingHere && snow.hold!.bout === b;
            return (
              <div key={b} className={`bout-row ${isDone ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
                <span className="grow stack-2">
                  <span className="strong">{label}</span>
                  <span className="muted tiny-text">
                    {active ? 'Timing now…' : work}
                    {loaded && weight ? ` · ${weight} kg` : ''}
                  </span>
                </span>
                <button
                  className="done-btn"
                  aria-pressed={isDone}
                  aria-label={isDone ? `Undo ${label.toLowerCase()}` : `Complete ${label.toLowerCase()}`}
                  onClick={() => {
                    primeAudio();
                    snowDispatch({ type: 'toggle', move: item.move, bout: b, now: Date.now() });
                  }}
                >
                  <Icon name="check" size={20} stroke={3} />
                </button>
              </div>
            );
          })}
          {item.hold !== undefined && <p className="muted tiny-text">Start runs a timer that beeps at the end. Or tick a set off yourself.</p>}
        </section>
      </div>

      <div className="bottombar">
        {snow.hold && held && (
          <div className="rest hold" role="timer" aria-live="off">
            <span className="rest-icon">
              <Icon name="timer" size={26} stroke={2} />
            </span>
            <div className="grow">
              <p className="eyebrow tiny rest-label">
                {held.easy ? 'Go hard' : MOVES[held.move].name}
                {holdSide ? ` · ${sideName(held, holdSide)}` : ''}
              </p>
              <p className="display lg nums tight">{formatClock(holdLeft)}</p>
            </div>
            <button className="ghost-btn" onClick={() => snowDispatch({ type: 'cancelHold' })}>
              Stop
            </button>
          </div>
        )}
        {snow.restEnd && (
          <div className="rest" role="timer" aria-live="off">
            <span className="rest-icon">
              <Icon name="timer" size={26} stroke={2} />
            </span>
            <div className="grow">
              <p className="eyebrow tiny rest-label">{item.easy ? 'Easy pedalling' : 'Rest'}</p>
              <p className="display lg nums tight">{formatClock(restLeft)}</p>
            </div>
            <button className="ghost-btn" onClick={() => snowDispatch({ type: 'addRest', seconds: 30 })}>
              +30s
            </button>
            <button className="rest-skip" onClick={() => snowDispatch({ type: 'skipRest' })}>
              Skip
            </button>
          </div>
        )}
        <div className="row gap-md">
          <button className="icon-btn square" aria-label="Previous exercise" disabled={index === 0} onClick={() => snowDispatch({ type: 'go', index: index - 1 })}>
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

      <HowToSheet item={howTo} onClose={() => setHowTo(null)} />
    </div>
  );
}
