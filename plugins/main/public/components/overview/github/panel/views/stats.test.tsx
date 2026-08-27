/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModuleConfiguration } from './stats';

interface PanelModuleConfigurationProps {
  mapResponseConfiguration: (
    content: unknown,
    type: string,
    params: { name: string },
  ) => { configuration: Record<string, unknown> } | null;
  settings: { field: string; render?: (value: unknown) => React.ReactNode }[];
}

jest.mock('../../../../common/modules/panel', () => ({
  PanelModuleConfiguration: (props: PanelModuleConfigurationProps) => {
    const configuration = props.mapResponseConfiguration(
      (global as { __CONTENT__?: unknown }).__CONTENT__,
      'agent',
      { name: 'agent-1' },
    );
    if (!configuration) {
      return <div>Module configuration unavailable</div>;
    }

    return (
      <div>
        {props.settings.map(setting => (
          <div key={setting.field}>
            {setting.render
              ? setting.render(configuration.configuration[setting.field])
              : configuration.configuration[setting.field]}
          </div>
        ))}
      </div>
    );
  },
}));

describe('GitHub stats mapResponseConfiguration', () => {
  it('reports an enabled module as enabled', () => {
    (global as { __CONTENT__?: unknown }).__CONTENT__ = {
      github: { enabled: 'yes', api_auth: [] },
    };

    const { getByText } = render(<ModuleConfiguration />);

    expect(getByText('enabled')).toBeInTheDocument();
  });

  it('picks content.github and omits the token', () => {
    (global as { __CONTENT__?: unknown }).__CONTENT__ = {
      github: { api_auth: [{ org_name: 'wazuh', api_token: 'tok-1' }] },
    };

    const { getByText, queryByText } = render(<ModuleConfiguration />);

    expect(getByText('wazuh')).toBeInTheDocument();
    expect(queryByText('tok-1')).not.toBeInTheDocument();
    expect(queryByText('Token')).not.toBeInTheDocument();
  });

  it('renders one credential panel when api_auth is a non-array object, omitting the token', () => {
    (global as { __CONTENT__?: unknown }).__CONTENT__ = {
      github: { api_auth: { org_name: 'wazuh', api_token: 'tok-1' } },
    };

    const { getByText, queryByText } = render(<ModuleConfiguration />);

    expect(getByText('wazuh')).toBeInTheDocument();
    expect(queryByText('tok-1')).not.toBeInTheDocument();
  });

  it('renders "No credentials configured" when api_auth is empty', () => {
    (global as { __CONTENT__?: unknown }).__CONTENT__ = {
      github: { api_auth: [] },
    };

    const { getByText } = render(<ModuleConfiguration />);

    expect(getByText('No credentials configured')).toBeInTheDocument();
  });

  it('renders a placeholder when an api_auth entry has no organization', () => {
    (global as { __CONTENT__?: unknown }).__CONTENT__ = {
      github: { api_auth: [{ api_token: 'tok-1' }] },
    };

    const { getByText } = render(<ModuleConfiguration />);

    expect(
      getByText('No identification fields configured'),
    ).toBeInTheDocument();
  });

  it('renders multiple api_auth entries with distinct panels', () => {
    (global as { __CONTENT__?: unknown }).__CONTENT__ = {
      github: {
        api_auth: [{ org_name: 'wazuh' }, { org_name: 'wazuh-2' }],
      },
    };

    const { getByText } = render(<ModuleConfiguration />);

    expect(getByText('wazuh')).toBeInTheDocument();
    expect(getByText('wazuh-2')).toBeInTheDocument();
  });
});
