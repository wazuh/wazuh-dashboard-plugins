import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import WzWazuhAPINotReachable from './wz-api-not-reachable';

const mockAddToast = jest.fn();

jest.mock('../../../../../../kibana-services', () => ({
  getToasts: () => ({ add: mockAddToast }),
}));

const store = configureMockStore()({
  configurationReducers: { clusterNodeSelected: 'node01' },
});

const renderWithError = (error: unknown) =>
  render(
    <Provider store={store}>
      <WzWazuhAPINotReachable error={error} />
    </Provider>,
  );

describe('WzWazuhAPINotReachable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names the missing permission when the API refuses the request', () => {
    renderWithError({ response: { status: 403 } });

    expect(screen.getByText('You have no permissions')).toBeInTheDocument();
    expect(screen.getByText('cluster:read')).toBeInTheDocument();
    expect(screen.getByText('node:id:node01')).toBeInTheDocument();
    expect(screen.queryByText('API not reachable')).not.toBeInTheDocument();
    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('says the API is not reachable when the request fails for another reason', () => {
    renderWithError('Server did not respond');

    expect(screen.getByText('API not reachable')).toBeInTheDocument();
    expect(
      screen.queryByText('You have no permissions'),
    ).not.toBeInTheDocument();
    expect(mockAddToast).toHaveBeenCalledTimes(1);
  });
});
