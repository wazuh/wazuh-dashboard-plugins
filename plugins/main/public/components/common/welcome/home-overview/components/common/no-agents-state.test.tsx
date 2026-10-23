import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NoAgentsState } from './no-agents-state';

// WzButtonPermissions needs the redux store for RBAC; a plain link is enough.
jest.mock('../../../../permissions/button', () => ({
  WzButtonPermissions: ({
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...rest}>{children}</a>
  ),
}));

describe('NoAgentsState', () => {
  it('says there is no data yet and links to the deploy-agent wizard', () => {
    render(<NoAgentsState deployAgentUrl='#deploy' />);
    expect(
      screen.getByText('No data yet. Deploy an agent to see results here.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Deploy new agent').closest('a')).toHaveAttribute(
      'href',
      '#deploy',
    );
  });
});
