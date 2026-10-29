import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';

import { CommandsEmptyState } from './commands-empty-state';
import NavigationService from '../../../../../../react-services/navigation-service';

jest.mock('../../../../../../kibana-services', () => ({
  getCore: () => ({
    application: {
      getUrlForApp: (appId: string, { path }: { path: string }) =>
        `/app/${appId}${path}`,
    },
  }),
}));

jest.mock(
  '../../../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

describe('CommandsEmptyState', () => {
  beforeAll(() => {
    NavigationService.getInstance(createMemoryHistory());
  });

  it('says how to add a command and that the endpoint must allow remote commands', () => {
    render(<CommandsEmptyState agent={{ group: ['default'] }} />);

    expect(
      screen.getByRole('heading', { name: 'No commands yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Add a command to a group this endpoint belongs to/),
    ).toHaveTextContent('The endpoint must also allow remote commands.');
    expect(
      screen.getByRole('link', { name: /Command monitoring guide/ }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining(
        'user-manual/capabilities/command-monitoring/configuration.html',
      ),
    );
  });

  it("links to the endpoint's group when it has one", () => {
    render(<CommandsEmptyState agent={{ group: ['default'] }} />);

    expect(
      screen.getByRole('link', { name: 'Go to group default' }),
    ).toHaveAttribute(
      'href',
      '/app/endpoint-groups#/manager/?tab=groups&group=default',
    );
  });

  it('links to the group list when the endpoint has several groups', () => {
    render(<CommandsEmptyState agent={{ group: ['default', 'linux'] }} />);

    expect(screen.getByRole('link', { name: 'Go to groups' })).toHaveAttribute(
      'href',
      '/app/endpoint-groups#/manager/?tab=groups',
    );
  });
});
