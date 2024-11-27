import { CoreState } from './state';

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
      remove: () => {},
      subscribe: subscribe,
    });

    expect(state.get('state_container')).toBe(true);

    state.set('state_container', false);

    expect(state.get('state_container')).toBe(false);
  });
});
