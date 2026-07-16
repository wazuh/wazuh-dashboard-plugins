import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentsByStatus } from './agents-by-status';

describe('AgentsByStatus', () => {
  it('shows the active count as the hero and the other statuses as secondary', () => {
    const { container } = render(
      <AgentsByStatus
        data={{
          active: 5,
          disconnected: 0,
          pending: 0,
          neverConnected: 2,
          total: 7,
        }}
      />,
    );
    expect(
      container.querySelector('[data-test-subj="agents-active-count"]')
        ?.textContent,
    ).toBe('5');
    expect(screen.getByText('agents active')).toBeInTheDocument();
    expect(screen.getByText(/disconnected/)).toBeInTheDocument();
    expect(screen.getByText(/never connected/)).toBeInTheDocument();
  });
});
