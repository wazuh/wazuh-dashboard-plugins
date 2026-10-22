import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { queryDataTestAttr } from '../../../test/public/query-attr';
import { ButtonExploreAgent } from './button-explore-agent';

const mockPinnedAgent = { current: null as null | Record<string, string> };

jest.mock('./wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn().mockImplementation(() => ({
    isPinnedAgent: () => Boolean(mockPinnedAgent.current),
    getPinnedAgent: () => mockPinnedAgent.current,
    unPinAgent: jest.fn(),
  })),
}));

const renderButton = () =>
  render(
    <Provider store={createStore(() => ({ appStateReducers: {} }))}>
      <ButtonExploreAgent />
    </Provider>,
  );

const warningSlot = (container: HTMLElement) =>
  container.querySelector(queryDataTestAttr('wzOutdatedAgentWarning'));

describe('ButtonExploreAgent', () => {
  afterEach(() => {
    mockPinnedAgent.current = null;
  });

  it('leaves no space for the outdated agent warning without an outdated pinned agent', () => {
    const { container } = renderButton();

    expect(warningSlot(container)).toBeNull();
  });

  it('shows the outdated agent warning when the pinned agent is below 5.0.0', () => {
    mockPinnedAgent.current = { id: '001', name: 'web-01', version: 'v4.9.0' };

    const { container } = renderButton();

    expect(warningSlot(container)).toBeInTheDocument();
  });
});
