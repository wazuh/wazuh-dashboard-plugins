import React from 'react';
import { render } from 'enzyme';
import { SyscollectorInventory } from './inventory';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';

const TABLE_ID = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';
const NETWORK_PORTS = 'Network ports';
const NETWORK_INTERFACES = 'Network interfaces';
const NETWORK_SETTINGS = 'Network settings';

const AGENT = {
  DEBIAN: {
    os: {
      uname:
        'Linux |ip-10-0-1-106 |4.9.0-9-amd64 |1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) |x86_64',
    },
  },
  WINDOWS: {
    os: {
      platform: 'windows',
    },
  },
  DARWIN: {
    os: {
      platform: 'darwin',
    },
  },
} as const;

const NETWORK_PORTS_COLUMNS = {
  LOCAL_PORT: 'Local port',
  LOCAL_IP: 'Local IP address',
  PROCESS: 'Process',
  PID: 'PID',
  STATE: 'State',
  PROTOCOL: 'Protocol',
} as const;

const NETWORK_INTERFACES_COLUMNS = {
  NAME: 'Name',
  MAC: 'MAC',
  STATE: 'State',
  MTU: 'MTU',
  TYPE: 'Type',
} as const;

const NETWORK_SETTINGS_COLUMNS = {
  INTERFACE: 'Interface',
  ADDRESS: 'Address',
  NETMASK: 'Netmask',
  PROTOCOL: 'Protocol',
  BROADCAST: 'Broadcast',
} as const;

const shouldRenderNetworkTableWithCorrectColumnsAndTitle = (
  dataTestId: string,
  title: string,
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  const wrapper = render(
    <SyscollectorInventory agent={agent} section={AgentTabs.NETWORK} />,
  );
  const networkPortsTable = wrapper
    .find(`[data-test-subj=${dataTestId}]`)
    .first();
  const networkPortsTitle = networkPortsTable
    .find('[data-test-subj=table-wz-api-title]')
    .text();
  const networkPortsColumns = networkPortsTable.find(
    '[data-test-subj=table-with-search-bar] th',
  );

  const tables = wrapper.find('table');

  for (let i = 0; i < tables.length; i++) {
    // This is done because the ID of the tables changes at each execution and breaks the snapshot.
    tables[i]['attribs']['id'] = TABLE_ID;
  }

  expect(wrapper).toMatchSnapshot();
  expect(networkPortsTitle.trim()).toContain(title);
  expect(networkPortsColumns.length).toEqual(columns.length);
  for (let i = 0; i < columns.length; i++) {
    expect(networkPortsColumns.eq(i).text()).toContain(columns[i]);
  }
};
const shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderNetworkTableWithCorrectColumnsAndTitle(
    'network-ports-table',
    NETWORK_PORTS,
    agent,
    columns,
  );
};

const shouldRenderNetworkInterfacesTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderNetworkTableWithCorrectColumnsAndTitle(
    'network-interfaces-table',
    NETWORK_INTERFACES,
    agent,
    columns,
  );
};

const shouldRenderNetworkSettingsTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderNetworkTableWithCorrectColumnsAndTitle(
    'network-settings-table',
    NETWORK_SETTINGS,
    agent,
    columns,
  );
};

describe('Network', () => {
  describe(NETWORK_SETTINGS, () => {
    it('A Linux agent should render network settings table with correct columns and title.', () => {
      const columns = [
        NETWORK_SETTINGS_COLUMNS.INTERFACE,
        NETWORK_SETTINGS_COLUMNS.ADDRESS,
        NETWORK_SETTINGS_COLUMNS.NETMASK,
        NETWORK_SETTINGS_COLUMNS.PROTOCOL,
        NETWORK_SETTINGS_COLUMNS.BROADCAST,
      ];

      shouldRenderNetworkSettingsTableWithCorrectColumnsAndTitle(
        AGENT.DEBIAN,
        columns,
      );
    });
    it('A Windows agent should render network settings table with correct columns and title.', () => {
      const columns = [
        NETWORK_SETTINGS_COLUMNS.INTERFACE,
        NETWORK_SETTINGS_COLUMNS.ADDRESS,
        NETWORK_SETTINGS_COLUMNS.NETMASK,
        NETWORK_SETTINGS_COLUMNS.PROTOCOL,
        NETWORK_SETTINGS_COLUMNS.BROADCAST,
      ];

      shouldRenderNetworkSettingsTableWithCorrectColumnsAndTitle(
        AGENT.WINDOWS,
        columns,
      );
    });
    it('A Apple agent should render network settings table with correct columns and title.', () => {
      const columns = [
        NETWORK_SETTINGS_COLUMNS.INTERFACE,
        NETWORK_SETTINGS_COLUMNS.ADDRESS,
        NETWORK_SETTINGS_COLUMNS.NETMASK,
        NETWORK_SETTINGS_COLUMNS.PROTOCOL,
        NETWORK_SETTINGS_COLUMNS.BROADCAST,
      ];

      shouldRenderNetworkSettingsTableWithCorrectColumnsAndTitle(
        AGENT.DARWIN,
        columns,
      );
    });
  });
  describe(NETWORK_INTERFACES, () => {
    it('A Linux agent should render network interfaces table with correct columns and title.', () => {
      const columns = [
        NETWORK_INTERFACES_COLUMNS.NAME,
        NETWORK_INTERFACES_COLUMNS.MAC,
        NETWORK_INTERFACES_COLUMNS.STATE,
        NETWORK_INTERFACES_COLUMNS.MTU,
        NETWORK_INTERFACES_COLUMNS.TYPE,
      ];

      shouldRenderNetworkInterfacesTableWithCorrectColumnsAndTitle(
        AGENT.DEBIAN,
        columns,
      );
    });
    it('A Windows agent should render network interfaces table with correct columns and title.', () => {
      const columns = [
        NETWORK_INTERFACES_COLUMNS.NAME,
        NETWORK_INTERFACES_COLUMNS.MAC,
        NETWORK_INTERFACES_COLUMNS.STATE,
        NETWORK_INTERFACES_COLUMNS.MTU,
        NETWORK_INTERFACES_COLUMNS.TYPE,
      ];

      shouldRenderNetworkInterfacesTableWithCorrectColumnsAndTitle(
        AGENT.WINDOWS,
        columns,
      );
    });
    it('A Apple agent should render network interfaces table with correct columns and title.', () => {
      const columns = [
        NETWORK_INTERFACES_COLUMNS.NAME,
        NETWORK_INTERFACES_COLUMNS.MAC,
        NETWORK_INTERFACES_COLUMNS.STATE,
        NETWORK_INTERFACES_COLUMNS.MTU,
        NETWORK_INTERFACES_COLUMNS.TYPE,
      ];

      shouldRenderNetworkInterfacesTableWithCorrectColumnsAndTitle(
        AGENT.DARWIN,
        columns,
      );
    });
  });
  describe(NETWORK_PORTS, () => {
    it('A Linux agent should render network ports table with correct columns and title.', () => {
      const columns = [
        NETWORK_PORTS_COLUMNS.LOCAL_PORT,
        NETWORK_PORTS_COLUMNS.LOCAL_IP,
        NETWORK_PORTS_COLUMNS.PROCESS,
        NETWORK_PORTS_COLUMNS.PID,
        NETWORK_PORTS_COLUMNS.STATE,
        NETWORK_PORTS_COLUMNS.PROTOCOL,
      ];

      shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle(
        AGENT.DEBIAN,
        columns,
      );
    });

    it('A Windows agent should render network ports table with correct columns and title.', () => {
      const columns = [
        NETWORK_PORTS_COLUMNS.LOCAL_PORT,
        NETWORK_PORTS_COLUMNS.LOCAL_IP,
        NETWORK_PORTS_COLUMNS.PROCESS,
        NETWORK_PORTS_COLUMNS.STATE,
        NETWORK_PORTS_COLUMNS.PROTOCOL,
      ];
      shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle(
        AGENT.WINDOWS,
        columns,
      );
    });

    it('A Apple agent should render network ports table with correct columns and title.', () => {
      const columns = [
        NETWORK_PORTS_COLUMNS.LOCAL_PORT,
        NETWORK_PORTS_COLUMNS.LOCAL_IP,
        NETWORK_PORTS_COLUMNS.STATE,
        NETWORK_PORTS_COLUMNS.PROTOCOL,
      ];

      shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle(
        AGENT.DARWIN,
        columns,
      );
    });
  });
});
