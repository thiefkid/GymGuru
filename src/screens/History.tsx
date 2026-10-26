import { useEffect, useRef, type Dispatch } from 'react';
import { TabBar } from '../components/TabBar';
import { exercisesForDay, formatWeight, topWeight } from '../logic';
import { DAYS, SHEET_HISTORY, WEEKS, blockName } from '../program';
import type { Action, State } from '../store';

export function History({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const day = state.historyDay;
  const fromSheet = WEEKS.some((w) => SHEET_HISTORY[`w${w}:${day}`]);
  const weeks = Array.from({ length: state.weeks }, (_, i) => i + 1);
  const list = useRef<HTMLDivElement>(null);

  // With more weeks than fit, scroll each chart so its latest logged week is in view.
  useEffect(() => {
    list.current?.querySelectorAll<HTMLElement>('.bars').forEach((el) => {
      const cols = [...el.querySelectorAll<HTMLElement>('.bar-col')].filter((c) => c.querySelector('.bar:not(.empty)'));
      const last = cols[cols.length - 1];
      el.scrollLeft = last ? Math.max(0, el.scrollLeft + last.getBoundingClientRect().right - el.getBoundingClientRect().right) : 0;
    });
  }, [day, state.weeks]);

  return (
    <div className="screen">
      <div className="scroll pad stack-lg">
        <header className="stack-xs">
          <p className="eyebrow">Block {blockName(state.weeks)} · top weight per week</p>
          <h1 className="display xl">History</h1>
        </header>

        <div className="segmented" role="group" aria-label="Training day">
          {DAYS.map((d) => (
            <button key={d.id} aria-pressed={d.id === day} onClick={() => dispatch({ type: 'historyDay', day: d.id })}>
              {d.name}
            </button>
          ))}
        </div>

        <div className="stack-sm" ref={list}>
          {exercisesForDay(day).map((e) => {
            const cells = weeks.map((w) => ({ week: w, top: topWeight(state.logs, w, day, e.id) }));
            const max = Math.max(0, ...cells.map((c) => c.top?.weight ?? 0));
            return (
              <div key={e.id} className="card row gap-lg center">
                <div className="grow stack-2">
                  <span className="strong">{e.name}</span>
                  <span className={max ? 'accent tiny-text' : 'muted tiny-text'}>{max ? `Best ${formatWeight(max)} kg` : 'No logs yet'}</span>
                </div>
                <div className="bars" role="img" aria-label={cells.map((c) => `Week ${c.week}: ${c.top ? `${formatWeight(c.top.weight)} kg` : 'none'}`).join(', ')}>
                  {cells.map((c) => (
                    <div key={c.week} className="bar-col">
                      <span className="bar-value nums">{c.top ? formatWeight(c.top.weight) : '—'}</span>
                      <div className="bar-track">
                        <div
                          className={c.top ? 'bar' : 'bar empty'}
                          style={c.top ? { height: `${Math.max(8, Math.round((c.top.weight / max) * 48))}px` } : undefined}
                        />
                      </div>
                      <span className="bar-label">W{c.week}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {fromSheet && <p className="muted tiny-text">Week 1 weights are imported from the W9-12 tab of your Google Sheet.</p>}
      </div>

      <div className="bottombar">
        <TabBar screen={state.screen} dispatch={dispatch} />
      </div>
    </div>
  );
}
