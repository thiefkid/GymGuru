import { useEffect, useRef, useState, type ChangeEvent, type Dispatch } from 'react';
import { Icon } from '../components/Icon';
import { toCsv } from '../logic';
import { initialState, isState, today, type Action, type State } from '../store';

function download(name: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Settings({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {});
  }, []);

  const sessions = Object.keys(state.logs).length;

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isState(data)) throw new Error('not a GymGuru backup');
      if (!confirm('Replace everything on this phone with the backup?')) return;
      dispatch({ type: 'replace', state: { ...initialState(), ...data, screen: 'settings', restEnd: null } });
      setMessage('Backup restored.');
    } catch {
      setMessage('That file isn’t a GymGuru backup.');
    }
  };

  const keepData = async () => {
    const ok = (await navigator.storage?.persist?.()) ?? false;
    setPersisted(ok);
    setMessage(ok ? 'Your browser will keep this data.' : 'The browser said no. Add GymGuru to your home screen and try again.');
  };

  return (
    <div className="screen">
      <div className="scroll pad stack-lg">
        <header className="row gap-md center">
          <button className="icon-btn round" aria-label="Back to today" onClick={() => dispatch({ type: 'screen', screen: 'today' })}>
            <Icon name="back" />
          </button>
          <h1 className="display xl">Settings</h1>
        </header>

        <section className="card stack-sm">
          <h2 className="strong">Your data</h2>
          <p className="muted small">
            Workouts are saved on this phone only ({sessions} {sessions === 1 ? 'session' : 'sessions'} so far). Download a backup now and then, so a new phone or a
            cleared browser doesn’t lose them.
          </p>
          <div className="stack-sm">
            <button className="secondary" onClick={() => download(`gymguru-backup-${today()}.json`, 'application/json', JSON.stringify(state, null, 2))}>
              Download backup
            </button>
            <button className="secondary" onClick={() => fileInput.current?.click()}>
              Restore from backup
            </button>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
            <button className="secondary" onClick={() => download(`gymguru-sets-${today()}.csv`, 'text/csv', toCsv(state.logs))}>
              Export sets as CSV (for Google Sheets)
            </button>
          </div>
        </section>

        <section className="card stack-sm">
          <h2 className="strong">Keep data safe</h2>
          <p className="muted small">
            {persisted
              ? 'The browser has agreed not to clear GymGuru’s data on its own.'
              : 'Browsers can clear website data when space runs low. Add GymGuru to your home screen, then ask the browser to keep it.'}
          </p>
          {!persisted && (
            <button className="secondary" onClick={keepData}>
              Ask browser to keep my data
            </button>
          )}
        </section>

        <section className="card stack-sm">
          <h2 className="strong">Install on your phone</h2>
          <p className="muted small">
            iPhone: open in Safari, tap Share, then “Add to Home Screen”. Android: open in Chrome, tap the ⋮ menu, then “Add to Home screen”. It then opens full screen and
            works offline.
          </p>
        </section>

        <section className="card stack-sm">
          <h2 className="strong">Start over</h2>
          <p className="muted small">Deletes every logged workout on this phone. Download a backup first.</p>
          <button
            className="danger"
            onClick={() => {
              if (confirm('Delete every logged workout on this phone?')) {
                dispatch({ type: 'replace', state: { ...initialState(), screen: 'settings' } });
                setMessage('All workouts deleted.');
              }
            }}
          >
            Delete all workouts
          </button>
        </section>

        {message && (
          <p className="toast" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
