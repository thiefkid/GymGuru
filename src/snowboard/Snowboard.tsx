import type { Dispatch } from 'react';
import type { Action, State } from '../store';
import { SnowPlan } from './SnowPlan';
import { SnowSession } from './SnowSession';
import { SnowSummary } from './SnowSummary';
import type { SnowAction, SnowState } from './store';

/** The Snowboard tab: the plan, a session under way, or its summary. */
export function Snowboard(props: { state: State; dispatch: Dispatch<Action>; snow: SnowState; snowDispatch: Dispatch<SnowAction> }) {
  if (props.snow.view === 'session') return <SnowSession snow={props.snow} snowDispatch={props.snowDispatch} />;
  if (props.snow.view === 'summary') return <SnowSummary snow={props.snow} snowDispatch={props.snowDispatch} />;
  return <SnowPlan {...props} />;
}
