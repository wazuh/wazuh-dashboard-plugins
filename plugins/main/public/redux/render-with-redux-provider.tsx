import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import storeRedux, { setupStore } from './store';
import { Provider } from 'react-redux';
import type { RenderOptions } from '@testing-library/react';

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {},
) {
  const {
    preloadedState = {},
    // Automatically create a store instance with the preloadedState
    store = setupStore(preloadedState),
    ...renderOptions
  } = options;

  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
