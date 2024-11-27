import { LifecycleService } from '../types';
import { Subscription, BehaviourSubject } from 'rxjs';

export interface StateContainer<T = any> {
  get: () => T;
  set: (value: T) => T;
  remove: () => any;
  updater$: BehaviourSubject<T>;
  subscribe: (callback: (value: T) => void) => Subscription;
}

export interface State<
  SetupDeps,
  SetupReturn,
  StartDeps,
  StartReturn,
  StopDeps,
  StopReturn,
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
  register: (name: string, value: StateContainer) => any;
  subscribe(name: string, callback: StateContainer['subscribe']): () => {};
}