import type { Dispatch } from 'react';
import type { Action, Screen } from '../store';
import { Icon } from './Icon';

export function TabBar({ screen, dispatch }: { screen: Screen; dispatch: Dispatch<Action> }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <button className="tab" aria-current={screen === 'today' ? 'page' : undefined} onClick={() => dispatch({ type: 'screen', screen: 'today' })}>
        <Icon name="calendar" size={18} stroke={2} />
        Today
      </button>
      <button className="tab" aria-current={screen === 'history' ? 'page' : undefined} onClick={() => dispatch({ type: 'screen', screen: 'history' })}>
        <Icon name="chart" size={18} stroke={2} />
        History
      </button>
    </nav>
  );
}
