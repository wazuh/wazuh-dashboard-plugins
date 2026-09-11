import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import WzRefreshAgentConfigButton from './refresh-agent-config-button';
import { clearAgentReportedConfigurationCache } from '../utils/agent-config-service';

jest.mock('../utils/agent-config-service', () => ({
  clearAgentReportedConfigurationCache: jest.fn(),
}));

const mockedGetErrorOrchestrator = { handleError: jest.fn() };

jest.mock('../../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => mockedGetErrorOrchestrator,
}));

const store = configureMockStore()({});

const renderButton = (onRefresh: () => Promise<void>) => {
  const utils = render(
    <Provider store={store}>
      <WzRefreshAgentConfigButton onRefresh={onRefresh} />
    </Provider>,
  );
  return { ...utils, button: utils.getByRole('button') };
};

describe('WzRefreshAgentConfigButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.clearActions();
  });

  it('clears the cached report before asking the parent to read it again', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { button } = renderButton(onRefresh);

    fireEvent.click(button);

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    const clearCacheMock = clearAgentReportedConfigurationCache as jest.Mock;
    expect(clearCacheMock).toHaveBeenCalledTimes(1);
    expect(clearCacheMock.mock.invocationCallOrder[0]).toBeLessThan(
      onRefresh.mock.invocationCallOrder[0],
    );
  });

  it('dispatches a refresh time update once the report has been re-read', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { button } = renderButton(onRefresh);

    fireEvent.click(button);

    await waitFor(() =>
      expect(store.getActions()).toContainEqual({
        type: 'UPDATE_CONFIGURATION_REFRESH_TIME',
      }),
    );
  });

  it('shows the loading state while the report is being re-read', async () => {
    let resolveRefresh: () => void = () => {};
    const onRefresh = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveRefresh = resolve;
        }),
    );
    const { button } = renderButton(onRefresh);

    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    resolveRefresh();

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('clears the loading state and reports the error when the refresh fails', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('Forbidden'));
    const { button } = renderButton(onRefresh);

    fireEvent.click(button);

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(mockedGetErrorOrchestrator.handleError).toHaveBeenCalledTimes(1);
  });
});
