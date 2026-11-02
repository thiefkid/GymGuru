import { useEffect, useRef, useState, type Dispatch } from 'react';
import { HowToSheet, type HowTo } from '../components/ExerciseSheet';
import { Icon } from '../components/Icon';
import { TabBar } from '../components/TabBar';
import { formatWeight } from '../logic';
import type { Action, State } from '../store';
import { KNEE_ADVICE, howToFor, rideVideoHowTo } from './guide';
import { MOVES, RIDE_VIDEOS } from './moves';
import {
  PLAN_WEEKS,
  SESSION_LETTER,
  TRIP_DATE,
  dayLabel,
  daysToTrip,
  isLoaded,
  isoDate,
  minutes,
  parseDate,
  phaseOf,
  prescription,
  rangeLabel,
  sessionsFor,
  snowKey,
  totalSessions,
  weekDates,
  weekOn,
  type Item,
  type Session,
} from './plan';
import { currentSession, hasProgress, lastKnee, lastWeight, type SnowAction, type SnowState } from './store';

const WEEKS = Array.from({ length: PLAN_WEEKS }, (_, i) => i + 1);

/** The session's movements grouped by block, in order. */
function blocks(session: Session): [string, Item[]][] {
  const out: [string, Item[]][] = [];
  for (const item of session.items) {
    const last = out[out.length - 1];
    if (last && last[0] === item.block) last[1].push(item);
    else out.push([item.block, [item]]);
  }
  return out;
}

function Countdown({ days }: { days: number }) {
  if (days > 0)
    return (
      <div className="countdown">
        <span className="display xxl accent nums">{days}</span>
        <span className="eyebrow tiny">{days === 1 ? 'day to go' : 'days to go'}</span>
      </div>
    );
  return (
    <div className="countdown">
      <span className="display xl accent">{days === 0 ? 'Today' : 'Done'}</span>
      <span className="eyebrow tiny">{days === 0 ? 'is ride day' : 'enjoy the snow'}</span>
    </div>
  );
}

interface Props {
  state: State;
  dispatch: Dispatch<Action>;
  snow: SnowState;
  snowDispatch: Dispatch<SnowAction>;
}

export function SnowPlan({ state, dispatch, snow, snowDispatch }: Props) {
  const [howTo, setHowTo] = useState<HowTo | null>(null);
  const weekStrip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    weekStrip.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [snow.week]);

  const today = isoDate(new Date());
  const nowWeek = weekOn(today);
  const daysLeft = daysToTrip(today);
  const trip = parseDate(TRIP_DATE);
  const dayBefore = new Date(trip.getFullYear(), trip.getMonth(), trip.getDate() - 1);

  const week = snow.week;
  const phase = phaseOf(week);
  const sessions = sessionsFor(week);
  const session = currentSession(snow);
  const key = snowKey(week, session.id);
  const label = snow.saved[key] ? 'Redo' : hasProgress(snow.logs[key]) ? 'Resume' : 'Start';
  const total = totalSessions();
  const done = WEEKS.reduce((n, w) => n + sessionsFor(w).filter((s) => snow.saved[snowKey(w, s.id)]).length, 0);
  const knee = lastKnee(snow);
  const range = weekDates(week);
  const heroWeek = Math.min(Math.max(nowWeek, 1), PLAN_WEEKS);

  return (
    <div className="screen">
      <div className="scroll pad stack-lg">
        <header className="stack-xs">
          <p className="eyebrow">Snowboard prep · first ride {dayLabel(trip)}</p>
          <h1 className="display xl">Ride ready</h1>
        </header>

        <section className="card snow-hero">
          <div className="row gap-lg center">
            <Countdown days={daysLeft} />
            <div className="stack-2 grow">
              <span className="eyebrow tiny accent">{nowWeek > PLAN_WEEKS ? 'Plan finished' : `Week ${heroWeek} of ${PLAN_WEEKS}`}</span>
              <span className="display md">{phaseOf(heroWeek).name}</span>
              <span className="muted tiny-text">
                {done} of {total} sessions done
              </span>
            </div>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Plan sessions done">
            <div style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </section>

        {knee && knee.feel !== 'good' && (
          <div className={`card knee-card is-${knee.feel}`} role="note">
            <span className="strong">{knee.feel === 'sore' ? 'Your knee was sore last session' : 'Your knee was a bit achy last session'}</span>
            <span className="muted tiny-text">{KNEE_ADVICE[knee.feel]}</span>
          </div>
        )}

        <section className="stack-sm">
          <div className="row between baseline">
            <h2 className="eyebrow">
              Week {week} · {rangeLabel(range.start, range.end)}
            </h2>
            <span className="muted small">{phase.name}</span>
          </div>
          <div className="week-strip" ref={weekStrip}>
            {WEEKS.map((w) => {
              const list = sessionsFor(w);
              const count = list.filter((s) => snow.saved[snowKey(w, s.id)]).length;
              return (
                <button
                  key={w}
                  className={`week-pill ${w === nowWeek ? 'is-now' : ''}`}
                  aria-pressed={w === week}
                  aria-label={`Week ${w}${w === nowWeek ? ' (this week)' : ''}: ${count} of ${list.length} sessions done`}
                  onClick={() => snowDispatch({ type: 'select', week: w })}
                >
                  <span className="display md">W{w}</span>
                  <span className="week-sub">
                    {count}/{list.length}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="small">{phase.goal}</p>
          <p className="muted tiny-text">{phase.effort}</p>
        </section>

        <section className="grid-3">
          {sessions.map((s) => {
            const k = snowKey(week, s.id);
            const saved = !!snow.saved[k];
            const started = hasProgress(snow.logs[k]);
            return (
              <button key={s.id} className="day-card snow-card" aria-pressed={s.id === session.id} onClick={() => snowDispatch({ type: 'select', week, session: s.id })}>
                <span className="eyebrow tiny">Session {SESSION_LETTER[s.id]}</span>
                <span className="display md">{s.name}</span>
                <span className="muted tiny-text">{s.focus}</span>
                <span className={`day-status ${saved ? 'is-saved' : started ? 'is-started' : ''}`}>
                  {saved && <Icon name="check" size={14} stroke={3} />}
                  {saved ? 'Done' : started ? 'In progress' : `~${minutes(s)} min`}
                </span>
              </button>
            );
          })}
          {sessions.length < 3 && (
            <div className="day-card snow-card ride-card">
              <span className="eyebrow tiny">{dayLabel(trip)}</span>
              <span className="display md">Ride!</span>
              <span className="muted tiny-text">Rest on {dayLabel(dayBefore)}.</span>
            </div>
          )}
        </section>

        <section>
          <div className="row between baseline section-head">
            <h2 className="display md">
              Session {SESSION_LETTER[session.id]} · {session.name}
            </h2>
            <span className="muted small">~{minutes(session)} min</span>
          </div>
          <p className="muted tiny-text plan-hint">
            <Icon name="play" size={10} stroke={2} /> Tap a movement for a video and tips.
          </p>
          {blocks(session).map(([block, items]) => (
            <div key={block} className="plan-block">
              <h3 className="eyebrow tiny block-head">{block}</h3>
              <ol className="plan">
                {items.map((item) => {
                  const move = MOVES[item.move];
                  const last = isLoaded(item) ? lastWeight(snow.logs, week, session.id, item.move) : null;
                  return (
                    <li key={item.move}>
                      <button className="plan-row plan-btn" onClick={() => setHowTo(howToFor(item))} aria-label={`${move.name}: how to do it`}>
                        <span className="plan-num">{session.items.indexOf(item) + 1}</span>
                        <span className="grow stack-2">
                          <span className="strong">{move.name}</span>
                          <span className="muted tiny-text">{prescription(item)}</span>
                          {item.note && <span className="accent tiny-text">{item.note}</span>}
                        </span>
                        {last && (
                          <span className="plan-last">
                            <span className="display sm">{formatWeight(last.weight)} kg</span>
                            <span className="muted tiny-text">Week {last.week}</span>
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>

        <section className="stack-sm">
          <h2 className="display md section-head">About the plan</h2>

          <details className="card info">
            <summary>
              <span className="strong grow">What it trains</span>
              <Icon name="next" size={16} />
            </summary>
            <div className="info-body">
              <ul className="info-list">
                <li>
                  <b>Your riding stance.</b> You’ll spend the day in a half squat, mostly on your heel edge. Wall sits, goblet squats and step-ups build legs that
                  last until the final run.
                </li>
                <li>
                  <b>Your right knee.</b> Band knee extensions, slow step-downs and single-leg work build the muscles that steady the knee, in ranges that are kind
                  to the meniscus.
                </li>
                <li>
                  <b>Your core.</b> It starts gently with dead bugs, bird dogs and planks, then adds anti-rotation, rotation and rollouts. Your core turns the board
                  and gets you up after every fall.
                </li>
                <li>
                  <b>Balance and edges.</b> Single-leg balance, the BOSU and heel-to-toe rocks teach your ankles and hips to keep the board on edge.
                </li>
                <li>
                  <b>Falls and long days.</b> Low jumps and skater hops teach soft landings, the fall drill teaches you to land on forearms and bum instead of wrists,
                  and bike intervals build stamina for a full day.
                </li>
              </ul>
            </div>
          </details>

          <details className="card info">
            <summary>
              <span className="strong grow">Right-knee rules</span>
              <Icon name="next" size={16} />
            </summary>
            <div className="info-body">
              <p className="small">Good news: snowboarding is easier on knees than skiing, because both feet are fixed to one board. These rules keep the gym work knee-friendly too.</p>
              <ul className="info-list">
                <li>
                  <b>Pain guide.</b> Mild discomfort up to about 3 out of 10 that has settled by the next morning is fine. Sharp pain, swelling, catching, locking or
                  the knee giving way means stop that exercise.
                </li>
                <li>
                  <b>Depth.</b> Only as deep as is pain-free. Boxes set the depth, and nothing loaded goes below parallel.
                </li>
                <li>
                  <b>No twisting on a bent knee.</b> On chops and throws, let your back foot pivot so the knee turns with your hips.
                </li>
                <li>
                  <b>Knee over your second toe</b> on every squat, lunge, step and landing. Don’t let it cave in.
                </li>
                <li>
                  <b>Right leg first</b> on single-leg work, and give the left leg the same reps.
                </li>
                <li>
                  <b>Knee check.</b> Every session ends with one, and the plan tells you when to ease off. Had surgery, or still get symptoms? Get a physio’s OK
                  before you start.
                </li>
              </ul>
            </div>
          </details>

          <details className="card info">
            <summary>
              <span className="strong grow">Fitting it in</span>
              <Icon name="next" size={16} />
            </summary>
            <div className="info-body">
              <ul className="info-list">
                <li>
                  <b>3 sessions a week</b> on days that aren’t back to back, such as Mon, Wed and Fri. Each takes about 40–50 minutes.
                </li>
                <li>
                  <b>Still doing your W9–12 split?</b> Leave at least a day between its Legs day and Session A, keep one full rest day a week, and do 2 sets instead of 3
                  when your legs are still sore. Weeks 6–7 count most, so ease off the split then if you need to.
                </li>
                <li>
                  <b>Missed a session?</b> Don’t double up; carry on with the current week.
                </li>
                <li>
                  <b>Week 8 is a taper:</b> two light sessions early in the week, rest on {dayLabel(dayBefore)} and ride on {dayLabel(trip)}.
                </li>
              </ul>
            </div>
          </details>

          <details className="card info">
            <summary>
              <span className="strong grow">Your first day on the snow</span>
              <Icon name="next" size={16} />
            </summary>
            <div className="info-body">
              <ul className="info-list">
                <li>
                  <b>Book a lesson</b> for at least your first morning. It’s the quickest way to start linking turns.
                </li>
                <li>
                  <b>Wear wrist guards and a helmet.</b> Wrists are the most common beginner injury; padded shorts help your tailbone too.
                </li>
                <li>
                  <b>Fall the way you trained:</b> on your heel side, sit down and roll onto your back; on your toe side, go onto forearms and knees. Make fists and
                  never reach out with open hands.
                </li>
                <li>
                  <b>Keep your knees soft.</b> Standing tall and stiff is what catches edges.
                </li>
                <li>
                  <b>Pushing along with one foot strapped in?</b> Take small steps and keep the board pointing where you’re going, so the strapped-in knee doesn’t
                  twist.
                </li>
                <li>
                  <b>Warm up for 5 minutes</b> before the first run: leg swings, a few squats, hip circles.
                </li>
                <li>
                  <b>Stop before you’re exhausted.</b> Tired legs catch edges, so finish while you still feel good.
                </li>
              </ul>
              <div className="stack-sm">
                {RIDE_VIDEOS.map((v) => (
                  <button key={v.video} className="secondary video-btn" onClick={() => setHowTo(rideVideoHowTo(v))}>
                    <Icon name="play" size={14} stroke={2} />
                    <span className="grow">{v.name}</span>
                    <span className="muted tiny-text">{v.meta.split(' · ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className="card info">
            <summary>
              <span className="strong grow">Your plan data</span>
              <Icon name="next" size={16} />
            </summary>
            <div className="info-body">
              <p className="small muted">
                Ticks and weights for this plan are saved on this phone, apart from your W9–12 workouts, so they don’t appear in History, the backup file or the
                Google Sheet.
              </p>
              <button
                className="danger"
                onClick={() => {
                  if (confirm('Clear every tick, weight and knee check in the snowboard plan?')) snowDispatch({ type: 'reset', today });
                }}
              >
                Start the plan over
              </button>
            </div>
          </details>
        </section>
      </div>

      <div className="bottombar">
        <button className="primary" onClick={() => snowDispatch({ type: 'start', date: today })}>
          <Icon name="play" size={18} stroke={2} />
          {label} session {SESSION_LETTER[session.id]}
        </button>
        <TabBar screen={state.screen} dispatch={dispatch} />
      </div>

      <HowToSheet item={howTo} onClose={() => setHowTo(null)} />
    </div>
  );
}
