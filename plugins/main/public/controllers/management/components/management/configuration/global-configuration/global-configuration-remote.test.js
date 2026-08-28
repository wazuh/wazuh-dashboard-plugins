/* eslint-disable camelcase -- fixtures reproduce the manager API's
   `bind_addr` field name verbatim */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import WzConfigurationGlobalConfigurationRemote from './global-configuration-remote';

const fullRemoteConfig = {
  'request-remote': {
    remote: [
      {
        legacy: {
          enabled: 'yes',
          port: '1514',
          protocol: ['TCP'],
          ipv6: 'no',
          local_ip: '127.0.0.1',
          queue_size: '131072',
          rids_closing_time: '300',
          connection_overtake_time: '60',
        },
        https: {
          port: '1517',
          bind_addr: '0.0.0.0',
          certificate: 'etc/certs/remoted.pem',
          key: 'etc/certs/remoted-key.pem',
        },
        agents: {
          allow_higher_versions: 'no',
        },
      },
    ],
  },
};

const onlyHTTPSConfig = {
  'request-remote': {
    remote: [
      {
        https: {
          port: '1517',
          bind_addr: '0.0.0.0',
          certificate: 'etc/certs/remoted.pem',
          key: 'etc/certs/remoted-key.pem',
        },
      },
    ],
  },
};

const onlyLegacyConfig = {
  'request-remote': {
    remote: [
      {
        legacy: {
          enabled: 'yes',
          port: '1514',
          protocol: ['TCP'],
          ipv6: 'no',
          local_ip: '127.0.0.1',
          queue_size: '131072',
          rids_closing_time: '300',
          connection_overtake_time: '60',
        },
      },
    ],
  },
};

const onlyAgentsConfig = {
  'request-remote': {
    remote: [
      {
        agents: {
          allow_higher_versions: 'no',
        },
      },
    ],
  },
};

const emptyRemoteArrayConfig = {
  'request-remote': {
    remote: [],
  },
};

const nonArrayRemoteConfig = {
  'request-remote': {
    remote: { legacy: {} },
  },
};

const emptySectionsConfig = {
  'request-remote': {
    remote: [
      {
        legacy: {},
        https: {},
        agents: {},
      },
    ],
  },
};

const errorStateConfig = {
  'request-remote': 'Fetch error message',
};

const missingRemoteConfig = {
  'request-remote': {},
};

describe('Global configuration remote settings', () => {
  it('should render all three groups with correct values when fully present', () => {
    const { getByText, getByDisplayValue, getAllByDisplayValue } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={fullRemoteConfig}
      />,
    );

    expect(getByText('HTTPS settings')).toBeInTheDocument();
    expect(getByText('Legacy settings')).toBeInTheDocument();
    expect(getByText('Agents settings')).toBeInTheDocument();

    // Each group describes itself in plain text, not behind a hover tooltip.
    expect(
      getByText(
        'Listener the agents use to communicate with the manager over HTTPS',
      ),
    ).toBeInTheDocument();
    expect(
      getByText(
        'Listener kept for agents that still communicate over the legacy protocol',
      ),
    ).toBeInTheDocument();
    expect(
      getByText('Settings applied to the agents that connect to this manager'),
    ).toBeInTheDocument();

    // HTTPS values
    expect(getByDisplayValue('1517')).toBeInTheDocument();
    expect(getByDisplayValue('0.0.0.0')).toBeInTheDocument();
    expect(getByDisplayValue('etc/certs/remoted.pem')).toBeInTheDocument();
    expect(getByDisplayValue('etc/certs/remoted-key.pem')).toBeInTheDocument();

    // Legacy values ('1514' -> Port, appears once since https.port is '1517')
    expect(getByDisplayValue('1514')).toBeInTheDocument();
    expect(getByDisplayValue('TCP')).toBeInTheDocument();
    expect(getByDisplayValue('127.0.0.1')).toBeInTheDocument();
    expect(getByDisplayValue('131072')).toBeInTheDocument();
    expect(getByDisplayValue('300')).toBeInTheDocument();
    expect(getByDisplayValue('60')).toBeInTheDocument();

    // 'yes' appears for legacy.enabled and 'no' for agents.allow_higher_versions and legacy.ipv6
    expect(getAllByDisplayValue('yes').length).toBeGreaterThanOrEqual(1);
    expect(getAllByDisplayValue('no').length).toBeGreaterThanOrEqual(2);

    // 'Port' label appears twice (HTTPS group + Legacy group)
    expect(getAllByDisplayValue('1517').length).toBe(1);
  });

  it('should render a dash for the fields a section does not report', () => {
    const { getByText, getByDisplayValue, getAllByDisplayValue } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={{
          'request-remote': {
            remote: [{ https: { port: '1517' } }],
          },
        }}
      />,
    );

    expect(getByText('HTTPS settings')).toBeInTheDocument();
    expect(getByDisplayValue('1517')).toBeInTheDocument();
    // bind_addr, certificate and key are absent: rendered as '-', never omitted
    // and never replaced by a plausible-looking default.
    expect(getAllByDisplayValue('-').length).toBe(3);
  });

  it('should render the protocol array as a readable string', () => {
    const { getByDisplayValue } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={{
          'request-remote': {
            remote: [{ legacy: { protocol: ['TCP', 'UDP'] } }],
          },
        }}
      />,
    );

    expect(getByDisplayValue('TCP, UDP')).toBeInTheDocument();
  });

  it('should render only the HTTPS group when legacy and agents are absent', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={onlyHTTPSConfig}
      />,
    );

    expect(getByText('HTTPS settings')).toBeInTheDocument();
    expect(queryByText('Legacy settings')).toBeFalsy();
    expect(queryByText('Agents settings')).toBeFalsy();
  });

  it('should render only the Legacy group when https and agents are absent', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={onlyLegacyConfig}
      />,
    );

    expect(getByText('Legacy settings')).toBeInTheDocument();
    expect(queryByText('HTTPS settings')).toBeFalsy();
    expect(queryByText('Agents settings')).toBeFalsy();
  });

  it('should render only the Agents group when https and legacy are absent', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={onlyAgentsConfig}
      />,
    );

    expect(getByText('Agents settings')).toBeInTheDocument();
    expect(queryByText('HTTPS settings')).toBeFalsy();
    expect(queryByText('Legacy settings')).toBeFalsy();
  });

  it('should render nothing and not throw when remote is an empty array', () => {
    const { queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={emptyRemoteArrayConfig}
      />,
    );

    expect(queryByText('HTTPS settings')).toBeFalsy();
    expect(queryByText('Legacy settings')).toBeFalsy();
    expect(queryByText('Agents settings')).toBeFalsy();
  });

  it('should not throw when remote is not an array (removing the table fixed the pre-existing crash)', () => {
    const { queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={nonArrayRemoteConfig}
      />,
    );

    expect(queryByText('HTTPS settings')).toBeFalsy();
    expect(queryByText('Legacy settings')).toBeFalsy();
    expect(queryByText('Agents settings')).toBeFalsy();
  });

  it('should render nothing when all three sections are empty objects', () => {
    const { queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={emptySectionsConfig}
      />,
    );

    expect(queryByText('HTTPS settings')).toBeFalsy();
    expect(queryByText('Legacy settings')).toBeFalsy();
    expect(queryByText('Agents settings')).toBeFalsy();
  });

  it('should render the existing no-config banner when request-remote is a string (error state)', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={errorStateConfig}
      />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('HTTPS settings')).toBeFalsy();
  });

  it('should render the existing no-config banner when request-remote has no remote property', () => {
    const { getByText, queryByText } = render(
      <WzConfigurationGlobalConfigurationRemote
        currentConfig={missingRemoteConfig}
      />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('HTTPS settings')).toBeFalsy();
  });
});
