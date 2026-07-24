import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentsByStatus } from './agents-by-status';

// WzButtonPermissions pulls in a react-redux `useSelector` for RBAC checks —
// out of scope for this presentational widget's tests, so stub it down to a
// plain link/button.
jest.mock('../../../../permissions/button', () => ({
  WzButtonPermissions: ({ children, ...rest }: any) => (
    <a {...rest}>{children}</a>
  ),
}));

describe('AgentsByStatus', () => {
  it('shows a "deploy new agent" prompt instead of counts when the fleet is empty', () => {
    const { container } = render(
      <AgentsByStatus
        data={{
          active: 0,
          disconnected: 0,
          pending: 0,
          neverConnected: 0,
          total: 0,
        }}
        deployAgentUrl='https://example.test/deploy'
      />,
    );
    expect(container.textContent).toContain(
      'This instance has no agents registered.',
    );
    const cta = screen.getByText('Deploy new agent').closest('a');
    expect(cta).toHaveAttribute('href', 'https://example.test/deploy');
    expect(screen.queryByText('agents active')).not.toBeInTheDocument();
  });
});
