/* eslint-disable camelcase -- fixtures reproduce the manager API's
   `agents_disconnection_time` field name verbatim */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import WzConfigurationAgentsConfigurationGlobal from './global-configuration-agents';

/* Shape of GET /cluster/{node}/configuration, which parses
wazuh-manager.conf and therefore keeps the configured time suffix. */
const fullGlobalConfig = {
  global: {
    agents_disconnection_time: '15m',
    agents_disconnection_alert_time: '0',
  },
};

const partialGlobalConfig = {
  global: {
    agents_disconnection_time: '15m',
  },
};

const errorStateConfig = {
  global: 'Fetch error message',
};

const missingGlobalConfig = {
  global: {},
};

describe('Global configuration agents settings', () => {
  it('should render the configured values as written in the configuration file', () => {
    const { getByText, getByDisplayValue } = render(
      <WzConfigurationAgentsConfigurationGlobal
        currentConfig={fullGlobalConfig}
      />,
    );

    expect(getByText('Agents settings')).toBeInTheDocument();
    /* The value keeps its unit suffix, so the label must not promise seconds. */
    expect(getByDisplayValue('15m')).toBeInTheDocument();
    expect(getByDisplayValue('0')).toBeInTheDocument();
    expect(
      getByText(
        'Time after which the manager considers an agent as disconnected since its last keepalive',
      ),
    ).toBeInTheDocument();
    expect(
      getByText('Alert time after agent disconnection'),
    ).toBeInTheDocument();
  });

  it('should render a dash for a field the configuration does not report', () => {
    const { getByDisplayValue } = render(
      <WzConfigurationAgentsConfigurationGlobal
        currentConfig={partialGlobalConfig}
      />,
    );

    expect(getByDisplayValue('15m')).toBeInTheDocument();
    /* An absent option is shown as '-' rather than as a plausible default. */
    expect(getByDisplayValue('-')).toBeInTheDocument();
  });

  it('should fall back to the unavailable panel when the section holds an error string', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationAgentsConfigurationGlobal
        currentConfig={errorStateConfig}
      />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(
      getByText(/There was a problem while fetching the configuration/),
    ).toBeInTheDocument();
    expect(queryByText('Agents settings')).not.toBeInTheDocument();
  });

  it('should report the section as not present when the node returns no global block', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationAgentsConfigurationGlobal
        currentConfig={missingGlobalConfig}
      />,
    );

    expect(
      getByText('This section is not present on the configuration file.'),
    ).toBeInTheDocument();
    expect(queryByText('Agents settings')).not.toBeInTheDocument();
  });

  it('should render the unavailable panel before any configuration arrives', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationAgentsConfigurationGlobal
        currentConfig={{}}
        wazuhNotReadyYet={true}
      />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('Agents settings')).not.toBeInTheDocument();
  });
});
