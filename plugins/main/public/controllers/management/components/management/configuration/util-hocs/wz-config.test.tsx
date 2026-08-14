import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import withWzConfig from './wz-config';
import { getCurrentConfig } from '../utils/wz-fetch';

jest.mock('../utils/wz-fetch', () => ({
  getCurrentConfig: jest.fn(),
}));

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

const mockedGetErrorOrchestrator = { handleError: jest.fn() };

jest.mock('../../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => mockedGetErrorOrchestrator,
}));

const store = configureMockStore()({
  configurationReducers: { clusterNodeSelected: false, refreshTime: 0 },
  appStateReducers: { wazuhNotReadyYet: false },
});

const Wrapped = ({ currentConfig }: { currentConfig?: object }) => (
  <div>modules: {Object.keys(currentConfig || {}).join(',')}</div>
);

const renderWithConfig = () => {
  const Component = withWzConfig()(Wrapped);
  return render(
    <Provider store={store}>
      <Component agent={{ id: '001' }} />
    </Provider>,
  );
};

describe('withWzConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the fetched configuration to the wrapped component', async () => {
    (getCurrentConfig as jest.Mock).mockResolvedValue({ fim: {}, execd: {} });

    renderWithConfig();

    await waitFor(() => screen.getByText(/modules: fim,execd/));
  });

  it('reports a failed fetch as a problem, not as a missing configuration', async () => {
    (getCurrentConfig as jest.Mock).mockRejectedValue(
      new Error('Index pattern not found'),
    );

    renderWithConfig();

    await waitFor(() =>
      screen.getByText(/there was a problem while fetching the configuration/i),
    );
    expect(
      screen.queryByText(/not present on the configuration file/i),
    ).not.toBeInTheDocument();
  });

  it('notifies the error orchestrator when the fetch fails', async () => {
    (getCurrentConfig as jest.Mock).mockRejectedValue(
      new Error('Index pattern not found'),
    );

    renderWithConfig();

    await waitFor(() =>
      expect(mockedGetErrorOrchestrator.handleError).toHaveBeenCalled(),
    );
  });
});
