import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { queryDataTestAttr } from '../../../test/public/query-attr';
import { ButtonExploreAgent } from './button-explore-agent';

let mockPinnedAgent: null | Record<string, string> = null;

jest.mock('./wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn().mockImplementation(() => ({
    isPinnedAgent: () => Boolean(mockPinnedAgent),
    getPinnedAgent: () => mockPinnedAgent,
    unPinAgent: jest.fn(),
  })),
}));

describe('ButtonExploreAgent', () => {
  it.each([
    [null, false],
    [{ id: '001', name: 'web-01', version: 'v4.9.0' }, true],
  ])('with pinned agent %o shows the outdated warning: %s', (agent, shown) => {
    mockPinnedAgent = agent;

    const { container } = render(
      <Provider store={createStore(() => ({ appStateReducers: {} }))}>
        <ButtonExploreAgent />
      </Provider>,
    );

    expect(
      Boolean(
        container.querySelector(queryDataTestAttr('wzOutdatedAgentWarning')),
      ),
    ).toBe(shown);
  });
});
