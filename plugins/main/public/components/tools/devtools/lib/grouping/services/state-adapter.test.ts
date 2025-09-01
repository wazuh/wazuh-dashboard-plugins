import { DefaultCurrentStateStore } from './state-adapter';

jest.mock('../../../../../../react-services', () => ({
  AppState: { setCurrentDevTools: jest.fn() },
}));

describe('DefaultCurrentStateStore', () => {
  it('forwards setCurrentDevTools to AppState', async () => {
    const mod = await import('../../../../../../react-services');
    const store = new DefaultCurrentStateStore();
    store.setCurrentDevTools('abc');
    expect(mod.AppState.setCurrentDevTools).toHaveBeenCalledWith('abc');
  });
});

