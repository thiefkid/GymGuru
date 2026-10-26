import { History } from './screens/History';
import { Session } from './screens/Session';
import { Settings } from './screens/Settings';
import { Summary } from './screens/Summary';
import { Today } from './screens/Today';
import { useStore } from './store';
import { useSheetSync } from './sync';

export function App() {
  const [state, dispatch] = useStore();
  useSheetSync(state, dispatch);
  const props = { state, dispatch };
  return (
    <main className="app">
      {state.screen === 'today' && <Today {...props} />}
      {state.screen === 'session' && <Session {...props} />}
      {state.screen === 'summary' && <Summary {...props} />}
      {state.screen === 'history' && <History {...props} />}
      {state.screen === 'settings' && <Settings {...props} />}
    </main>
  );
}
