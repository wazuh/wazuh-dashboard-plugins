import { ILogger } from '../../../common/services/configuration';
import { createHOCs } from './hocs/creator';
import { createHooks } from './hooks/creator';
import { State, StateContainer } from './types';

export class CoreState implements State {
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
    // TODO: unsubscribe when the app is stopped
    return stateContainerSubscription;
  }
}
