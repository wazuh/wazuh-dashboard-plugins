import { CoreState } from './state';
import { BehaviorSubject } from 'rxjs';

const noop = () => {};
const logger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
};

describe('State', () => {
  it('Throw error accessing to non-existent state container', () => {
    const state = new CoreState(logger);
    expect(() => {
      state.get('no_existent_state_container');
    }).toThrow(
      'State container [no_existent_state_container] does not exist. Did you forget to register it?',
    );

    expect(() => {
      state.set('no_existent_state_container', {});
    }).toThrow(
      'State container [no_existent_state_container] does not exist. Did you forget to register it?',
    );

    expect(() => {
      state.remove('no_existent_state_container');
    }).toThrow(
      'State container [no_existent_state_container] does not exist. Did you forget to register it?',
    );

    expect(() => {
      state.subscribe('no_existent_state_container', () => {});
    }).toThrow(
      'State container [no_existent_state_container] does not exist. Did you forget to register it?',
    );
  });

  it('Register a state container, get value, set new value and get new value', () => {
    const state = new CoreState(logger);

    const subscribe = jest.fn();
    state.register('state_container', {
      _value: true, // mock state. This does not exist in the StateContainer type
      get() {
        return this._value;
      },
      set(newValue) {
        this._value = newValue;
      },
      remove() {},
      subscribe: subscribe,
    });

    expect(state.get('state_container')).toBe(true);

    state.set('state_container', false);

    expect(state.get('state_container')).toBe(false);
  });

  it('Register a state container, subscribe, set new value and remove the subscription', () => {
    const state = new CoreState(logger);

    const subscriber = jest.fn();
    state.register('state_container', {
      _value: true, // mock state. This does not exist in the StateContainer type
      get() {
        return this._value;
      },
      set(newValue) {
        this._value = newValue;
        this.updater$.next(this._value);
      },
      remove() {},
      updater$: new BehaviorSubject(),
      subscribe(cb) {
        return this.updater$.subscribe(cb);
      },
    });

    expect(state._subscriptions._subscriptions).toEqual(null);

    const unsubscribe = state.subscribe('state_container', subscriber);
    expect(state._subscriptions._subscriptions).toHaveLength(1);

    state.set('state_container', false);
    expect(subscriber).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(state._subscriptions._subscriptions).toHaveLength(0);

    state.set('state_container', false);
    expect(subscriber).toHaveBeenCalledTimes(2);
  });
});
