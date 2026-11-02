import { History } from './screens/History';
import { Session } from './screens/Session';
import { Settings } from './screens/Settings';
import { Summary } from './screens/Summary';
import { Today } from './screens/Today';
import { Snowboard } from './snowboard/Snowboard';
import { useSnowStore } from './snowboard/store';
import { useStore } from './store';
import { useSheetSync } from './sync';

export function App() {
  const [state, dispatch] = useStore();
  const [snow, snowDispatch] = useSnowStore();
  useSheetSync(state, dispatch);
  const props = { state, dispatch };
  return (
    <main className="app">
      {state.screen === 'today' && <Today {...props} />}
      {state.screen === 'session' && <Session {...props} />}
      {state.screen === 'summary' && <Summary {...props} />}
      {state.screen === 'history' && <History {...props} />}
      {state.screen === 'settings' && <Settings {...props} />}
      {state.screen === 'snow' && <Snowboard {...props} snow={snow} snowDispatch={snowDispatch} />}
    </main>
  );
}
