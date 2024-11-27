import { ILogger } from '../../../common/services/configuration';
import { createHOCs } from './hocs/creator';
import { createHooks } from './hooks/creator';
import { State, StateContainer } from './types';
import { Subscription } from 'rxjs';

export class CoreState implements State {
  private _subscriptions: Subscription = new Subscription();
  private stateContainers: Map<string, StateContainer>;
  constructor(private logger: ILogger) {
    this.stateContainers = new Map();
  }
  setup() {
    this.logger.debug('Setup');
    const hooks = createHooks({ state: this });
    const hocs = createHOCs(hooks);
    return {
      hooks,
      hocs,
    };
  }
  start() {
    this.logger.debug('Start');
  }
  stop() {
    this.logger.debug('Stop');
    this.logger.debug('Unsubscribing');
    this._subscriptions.unsubscribe();
    this.logger.debug('Unsubscribed');
  }
  getStateContainer(name: string) {
    if (!this.stateContainers.has(name)) {
      const error = new Error(
        `State container [${name}] does not exist. Did you forget to register it?`,
      );
      this.logger.error(error.message);
      throw error;
    }
    return this.stateContainers.get(name);
  }
  register(name: string, value: StateContainer) {
    this.stateContainers.set(name, value);
  }
  get(name: string) {
    return this.getStateContainer(name)!.get();
  }
  set(name: string, value: any) {
    return this.getStateContainer(name)!.set(value);
  }
  remove(name: string) {
    return this.getStateContainer(name)!.remove(value);
  }
  subscribe(name: string, callback: (value) => void) {
    const stateContainerSubscription =
      this.getStateContainer(name)!.subscribe(callback);

    // Create a wrapper of the original subscription to remove all in the stop plugin lifecycle
    const stateContainerUnsub = () => {
      stateContainerSubscription.unsubscribe();
      this._subscriptions.remove(stateContainerSubscription);
    };
    this._subscriptions.add(stateContainerSubscription);
    return stateContainerUnsub;
  }
}
