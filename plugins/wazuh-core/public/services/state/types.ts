import { Subscription, BehaviourSubject } from 'rxjs';
import { LifecycleService } from '../types';

export interface StateContainer<T = any> {
  get: () => T;
  set: (value: T) => T;
  remove: () => T;
  updater$: BehaviourSubject<T>;
  subscribe: (callback: (value: T) => void) => Subscription;
}

export interface State<
  SetupDeps = any,
  SetupReturn = any,
  StartDeps = any,
  StartReturn = any,
  StopDeps = any,
  StopReturn = any,
> extends LifecycleService<
    SetupDeps,
    SetupReturn,
    StartDeps,
    StartReturn,
    StopDeps,
    StopReturn
  > {
  get: (name: string) => any;
  set: (name: string, value: any) => any;
  remove: (name: string) => any;
  getStateContainer: (name: string) => StateContainer | undefined;
  register: (name: string, value: StateContainer) => any;
  subscribe: (
    name: string,
    callback: StateContainer['subscribe'],
  ) => () => void;
}
