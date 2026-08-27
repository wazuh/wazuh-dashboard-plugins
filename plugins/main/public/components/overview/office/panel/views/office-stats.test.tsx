/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModuleConfiguration } from './office-stats';

interface Setting {
  field: string;
  label: string;
  render?: (value: unknown) => React.ReactNode;
}

interface PanelModuleConfigurationProps {
  mapResponseConfiguration: (
    content: unknown,
    type: string,
    params: { name: string },
  ) => { configuration: Record<string, unknown> } | null;
  settings: Setting[];
}

jest.mock('../../../../common/modules/panel', () => ({
  PanelModuleConfiguration: (props: PanelModuleConfigurationProps) => {
    const entity = props.mapResponseConfiguration(
      (global as { __CONTENT__?: unknown }).__CONTENT__,
      'agent',
      { name: 'agent-1' },
    );

    if (!entity) {
      return <div>Module configuration unavailable</div>;
    }

    return (
      <div>
        {props.settings.map(setting => (
          <div key={setting.field}>
            {setting.render
              ? setting.render(entity.configuration[setting.field])
              : entity.configuration[setting.field]}
          </div>
        ))}
      </div>
    );
  },
}));

const setContent = (content: unknown) => {
  (global as { __CONTENT__?: unknown }).__CONTENT__ = content;
};

describe('Office 365 stats mapResponseConfiguration', () => {
  it('picks content.office365, renders retained fields and subscriptions, and omits secrets', () => {
    setContent({
      office365: {
        enabled: 'yes',
        only_future_events: 'no',
        curl_max_size: 1048576,
        interval: 600,
        api_auth: [
          {
            tenant_id: 't-1',
            client_id: 'c-1',
            client_secret: 's-1',
            client_secret_path: '/path/to/secret',
          },
        ],
        subscriptions: ['Audit.AzureActiveDirectory'],
      },
    });

    const { getByText, queryByText } = render(<ModuleConfiguration />);

    expect(getByText('1048576')).toBeInTheDocument();
    expect(getByText('600')).toBeInTheDocument();
    expect(getByText('t-1')).toBeInTheDocument();
    expect(getByText('Audit.AzureActiveDirectory')).toBeInTheDocument();
    expect(queryByText('c-1')).not.toBeInTheDocument();
    expect(queryByText('s-1')).not.toBeInTheDocument();
    expect(queryByText('/path/to/secret')).not.toBeInTheDocument();
    expect(queryByText('Client ID')).not.toBeInTheDocument();
    expect(queryByText('Client secret')).not.toBeInTheDocument();
    expect(queryByText('Path file of client secret')).not.toBeInTheDocument();
  });

  it('omits the API type and keeps only the tenant ID', () => {
    setContent({
      office365: {
        enabled: 'yes',
        api_auth: [{ tenant_id: 't', client_id: 'c', api_type: 'gcc-high' }],
        subscriptions: [],
      },
    });

    const { getByText, queryByText } = render(<ModuleConfiguration />);

    expect(getByText('Tenant ID')).toBeInTheDocument();
    expect(getByText('t')).toBeInTheDocument();
    expect(queryByText('API type')).not.toBeInTheDocument();
    expect(queryByText('gcc-high')).not.toBeInTheDocument();
  });

  it('renders no credentials text when api_auth is absent', () => {
    setContent({
      office365: {
        enabled: 'yes',
        subscriptions: [],
      },
    });

    const { getByText } = render(<ModuleConfiguration />);
    expect(getByText('No credentials configured')).toBeInTheDocument();
  });

  it('renders no credentials text when api_auth is an empty array', () => {
    setContent({
      office365: {
        enabled: 'yes',
        api_auth: [],
        subscriptions: [],
      },
    });

    const { getByText } = render(<ModuleConfiguration />);

    expect(getByText('No credentials configured')).toBeInTheDocument();
  });

  it('renders one credential panel without throwing when api_auth is a non-array object, omitting secrets', () => {
    setContent({
      office365: {
        enabled: 'yes',
        api_auth: {
          tenant_id: 't-1',
          client_id: 'c-1',
          client_secret: 's-1',
        },
        subscriptions: [],
      },
    });

    const { getByText, queryByText } = render(<ModuleConfiguration />);
    expect(getByText('t-1')).toBeInTheDocument();
    expect(queryByText('c-1')).not.toBeInTheDocument();
    expect(queryByText('s-1')).not.toBeInTheDocument();
  });

  it('renders a placeholder when an api_auth entry has no retained fields', () => {
    setContent({
      office365: {
        enabled: 'yes',
        api_auth: [
          { client_id: 'c-1', client_secret: 's-1', api_type: 'commercial' },
        ],
        subscriptions: [],
      },
    });

    const { getByText, queryByText } = render(<ModuleConfiguration />);
    expect(
      getByText('No identification fields configured'),
    ).toBeInTheDocument();
    expect(queryByText('commercial')).not.toBeInTheDocument();
  });

  it('renders multiple api_auth entries with distinct panels', () => {
    setContent({
      office365: {
        enabled: 'yes',
        api_auth: [{ tenant_id: 't-1' }, { tenant_id: 't-2' }],
        subscriptions: [],
      },
    });

    const { getByText } = render(<ModuleConfiguration />);
    expect(getByText('t-1')).toBeInTheDocument();
    expect(getByText('t-2')).toBeInTheDocument();
  });

  it('renders subscriptions without throwing when the value is not an array', () => {
    setContent({
      office365: { enabled: 'yes', subscriptions: 'Audit.Exchange' },
    });

    expect(() => render(<ModuleConfiguration />)).not.toThrow();
  });

  it('yields the module-not-configured state when content only holds wmodules.internal_options', () => {
    setContent({
      wmodules: {
        internal_options: {
          'wazuh_modules.debug': 2,
          task_nice: 0,
          max_eps: 0,
          kill_timeout: 0,
        },
      },
    });

    const { getByText, queryByText } = render(<ModuleConfiguration />);

    expect(getByText('Module configuration unavailable')).toBeInTheDocument();
    expect(queryByText('yes')).not.toBeInTheDocument();
  });
});
