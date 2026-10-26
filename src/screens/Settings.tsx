import { useEffect, useRef, useState, type ChangeEvent, type Dispatch } from 'react';
import scriptSource from '../../apps-script/Code.gs?raw';
import { Icon } from '../components/Icon';
import { toCsv } from '../logic';
import { connect, fetchFromSheet, isScriptUrl } from '../sync';
import { initialState, isState, today, type Action, type State } from '../store';

function download(name: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function SheetSync({ state, dispatch, say }: { state: State; dispatch: Dispatch<Action>; say: (m: string) => void }) {
  const { sync } = state;
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = sync.queue.length;

  const onConnect = async () => {
    setBusy(true);
    try {
      const sheetName = await connect(url, sync.key);
      dispatch({ type: 'syncConnect', url: url.trim(), sheetName });
      say(`Connected to “${sheetName}”. Your saved workouts are being copied to it.`);
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!confirm('Bring workouts from the Google Sheet onto this phone? Days in the sheet replace the same days here.')) return;
    setBusy(true);
    try {
      const restored = await fetchFromSheet(state);
      const count = Object.keys(restored.logs).length;
      dispatch({ type: 'restore', ...restored });
      say(count ? `Restored ${count} ${count === 1 ? 'workout' : 'workouts'} from the sheet.` : 'The sheet has no GymGuru workouts yet.');
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!sync.url) {
    return (
      <section className="card stack-md">
        <h2 className="strong">Google Sheet sync</h2>
        <p className="muted small">
          Save every workout to your Google Sheet automatically, so nothing is lost if this phone’s data is cleared. Set it up once, easiest on a computer:
        </p>
        <ol className="steps">
          <li>
            Open your Google Sheet and choose <b>Extensions → Apps Script</b>.
          </li>
          <li>
            Delete the code that’s there and paste the GymGuru script.
            <button className="secondary compact" onClick={async () => say((await copy(scriptSource)) ? 'Script copied.' : 'Couldn’t copy. Get it from apps-script/Code.gs in the GitHub repo.')}>
              Copy script
            </button>
          </li>
          <li>
            Click <b>Deploy → New deployment</b>, choose type <b>Web app</b>, set <b>Execute as: Me</b> and <b>Who has access: Anyone</b>, then <b>Deploy</b>. Allow access when asked
            (Google warns it’s unverified because it’s your own script: <b>Advanced → Go to …</b>).
          </li>
          <li>Copy the web app URL, send it to your phone, and paste it here.</li>
        </ol>
        <label className="field">
          <span className="eyebrow tiny">Web app URL</span>
          <input
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://script.google.com/macros/s/…/exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        {url && !isScriptUrl(url) && <p className="warn small">That doesn’t look like a web app URL. It should end in /exec.</p>}
        <button className="primary small-primary" disabled={!isScriptUrl(url) || busy} onClick={onConnect}>
          {busy ? 'Connecting…' : 'Connect'}
        </button>
        <details className="small">
          <summary className="muted">Already set up on another phone?</summary>
          <div className="stack-sm details-body">
            <p className="muted small">
              Restoring that phone’s backup brings its sync key along. Or paste its sync key (Settings → Google Sheet sync → Sync key) here before connecting:
            </p>
            <label className="field">
              <span className="eyebrow tiny">Sync key</span>
              <input type="text" autoComplete="off" spellCheck={false} value={key} placeholder={sync.key} onChange={(e) => setKey(e.target.value.trim())} />
            </label>
            <button
              className="secondary"
              disabled={key.length < 32}
              onClick={() => {
                dispatch({ type: 'syncSetKey', key });
                setKey('');
                say('Sync key updated.');
              }}
            >
              Use this key
            </button>
          </div>
        </details>
      </section>
    );
  }

  return (
    <section className="card stack-md">
      <div className="row between baseline">
        <h2 className="strong">Google Sheet sync</h2>
        <span className={`sync-dot ${sync.error ? 'is-error' : pending ? 'is-pending' : ''}`}>{sync.error ? 'Problem' : pending ? 'Waiting' : 'On'}</span>
      </div>
      <p className="muted small">
        Saving a workout adds its sets to the <b>GymGuru Log</b> tab of “{sync.sheetName}”.
      </p>
      <p className="small">
        {pending
          ? `${pending} ${pending === 1 ? 'workout' : 'workouts'} waiting to sync. They’ll go as soon as you’re online.`
          : sync.lastSynced
            ? `Everything is synced. Last sync ${timeLabel(sync.lastSynced)}.`
            : 'Everything is synced.'}
      </p>
      {sync.error && <p className="warn small">{sync.error}</p>}
      <div className="stack-sm">
        <button className="secondary" disabled={busy} onClick={() => dispatch({ type: 'syncAll' })}>
          Sync all workouts again
        </button>
        <button className="secondary" disabled={busy} onClick={onRestore}>
          {busy ? 'Working…' : 'Restore from Google Sheet'}
        </button>
        <button
          className="secondary"
          onClick={() => {
            if (confirm('Stop syncing to the Google Sheet? Nothing is deleted from the sheet.')) dispatch({ type: 'syncDisconnect' });
          }}
        >
          Disconnect
        </button>
      </div>
      <details className="small">
        <summary className="muted">Sync key</summary>
        <div className="stack-sm details-body">
          <p className="muted small">Only this key can write to your sheet. Keep it private; you only need it to connect another phone.</p>
          <code className="key">{sync.key}</code>
          <button className="secondary" onClick={async () => say((await copy(sync.key)) ? 'Sync key copied.' : 'Couldn’t copy.')}>
            Copy sync key
          </button>
        </div>
      </details>
    </section>
  );
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

        {message && (
          <p className="toast" role="status">
            {message}
          </p>
        )}

        <SheetSync state={state} dispatch={dispatch} say={setMessage} />

        <section className="card stack-sm">
          <h2 className="strong">Backup file</h2>
          <p className="muted small">
            Workouts live on this phone ({sessions} {sessions === 1 ? 'session' : 'sessions'} so far). A backup file includes everything, including the sync key.
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
              Export sets as CSV
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
          <p className="muted small">Deletes every logged workout on this phone. Google Sheet sync stays connected and the sheet is not touched.</p>
          <button
            className="danger"
            onClick={() => {
              if (confirm('Delete every logged workout on this phone?')) {
                dispatch({ type: 'replace', state: { ...initialState(), screen: 'settings', sync: { ...state.sync, queue: [], error: null } } });
                setMessage('All workouts deleted from this phone.');
              }
            }}
          >
            Delete all workouts
          </button>
        </section>
      </div>
    </div>
  );
}
