import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentConfigurationSource } from './agent-configuration-source';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

jest.mock('../groups/utils/groups-handler', () => ({
  __esModule: true,
  default: { getFileContent: jest.fn() },
}));

jest.mock('../../../../../kibana-services', () => ({
  getCore: () => ({ application: {} }),
}));

jest.mock(
  '../../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

jest.mock('../../../../../utils/applications', () => ({
  endpointGroups: { id: 'endpoint-groups' },
}));

jest.mock('../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getUrlForApp: (appId: string, { path }: { path: string }) =>
        `/app/${appId}${path}`,
    }),
  },
}));

/* RBAC runs through react-redux selectors; deny the configuration update of
the `restricted` group only, instead of standing up a store. */
jest.mock('../../../../../components/common/hooks/useUserPermissions', () => ({
  useUserPermissionsRequirements: (
    permissions: { action: string; resource: string }[] | null,
  ) => {
    const missing = (permissions || []).filter(
      ({ action, resource }) =>
        action === 'group:update_config' && resource === 'group:id:restricted',
    );
    return [missing.length ? missing : false, {}];
  },
}));

jest.mock('../../../../../components/common/hooks/use-user-is-admin', () => ({
  useUserPermissionsIsAdminRequirements: () => [null, {}],
}));

const shortcut = (group: string) =>
  screen.getByRole('link', {
    name: `Edit the configuration of the ${group} group`,
  });

describe('AgentConfigurationSource', () => {
  it('adds a shortcut to the configuration editor of each group', () => {
    render(<AgentConfigurationSource groups={['default', 'linux']} />);

    expect(shortcut('default')).toHaveAttribute(
      'href',
      '/app/endpoint-groups#/manager/?tab=groups&group=default&editConfig=true',
    );
    expect(shortcut('linux')).toHaveAttribute(
      'href',
      '/app/endpoint-groups#/manager/?tab=groups&group=linux&editConfig=true',
    );
  });

  it('disables the shortcut of a group whose configuration the user cannot update', () => {
    render(<AgentConfigurationSource groups={['default', 'restricted']} />);

    expect(shortcut('default')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: 'Edit the configuration of the restricted group',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Edit the configuration of the restricted group',
      }),
    ).toBeDisabled();
  });

  it('explains where the settings are changed and links to the docs', () => {
    render(<AgentConfigurationSource groups={['default']} />);

    const notice = screen.getByText('These settings are read-only')
      .parentElement!.parentElement!;
    expect(notice).toHaveTextContent('agent.conf');
    expect(notice).toHaveTextContent('ossec.conf');
    expect(notice).toHaveTextContent('override the local file');
    expect(
      screen.getByRole('link', {
        name: /Learn more about centralized configuration/,
      }),
    ).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/reference/centralized-configuration.html',
    );
  });

  it('points to the local file and to the groups when the agent has no group', () => {
    render(<AgentConfigurationSource groups={[]} />);

    expect(screen.getByText(/assign the agent to a group/)).toBeInTheDocument();
    expect(
      screen.queryByText('Edit group configuration:'),
    ).not.toBeInTheDocument();
  });
});
