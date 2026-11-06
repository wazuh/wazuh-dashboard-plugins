import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ThreatHuntingEmptyState } from './threat-hunting-empty-state';

const mockUnPinAgent = jest.fn();

jest.mock('../../../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn(() => ({ unPinAgent: mockUnPinAgent })),
}));

const renderWithPinnedAgent = (currentAgentData: Record<string, unknown>) =>
  render(
    <Provider
      store={createStore(() => ({ appStateReducers: { currentAgentData } }))}
    >
      <ThreatHuntingEmptyState />
    </Provider>,
  );

describe('ThreatHuntingEmptyState', () => {
  beforeEach(() => mockUnPinAgent.mockClear());

  it('keeps the generic callout without a pinned agent', () => {
    renderWithPinnedAgent({});

    expect(
      screen.getByText('No results match your search criteria'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Unpin agent')).not.toBeInTheDocument();
  });

  it.each([
    [{ id: '001', name: 'server' }, /No results for the agent server \(001\)/],
    [{ id: '003' }, /No results for the agent 003 in/],
  ])('names the pinned agent %o and unpins it', (agent, title) => {
    renderWithPinnedAgent(agent);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(
      screen.getByText(/The pinned agent filters these results/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Unpin agent'));

    expect(mockUnPinAgent).toHaveBeenCalledTimes(1);
  });
});
