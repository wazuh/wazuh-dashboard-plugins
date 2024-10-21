import React from 'react';
import { render } from 'enzyme';
import { SyscollectorInventory } from './inventory';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';

const TABLE_ID = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';
const SOFTWARE_PACKAGES = 'Packages';
const SOFTWARE_WINDOWS_UPDATES = 'Windows updates';
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

const SOFTWARE_PACKAGES_COLUMNS = {
  NAME: 'Name',
  ARCHITECTURE: 'Architecture',
  VENDOR: 'Vendor',
  VERSION: 'Version',
  FORMAT: 'Format',
  LOCATION: 'Location',
  DESCRIPTION: 'Description',
} as const;

const SOFTWARE_WINDOWS_UPDATES_COLUMNS = {
  UPDATE_CODE: 'Update code',
} as const;

const shouldRenderTableWithCorrectColumnsAndTitle = (
  dataTestId: string,
  title: string,
  agentTab: (typeof AgentTabs)[keyof typeof AgentTabs],
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  const wrapper = render(
    <SyscollectorInventory agent={agent} section={agentTab} />,
  );
  const visTable = wrapper.find(`[data-test-subj=${dataTestId}]`).first();
  const visTitle = visTable.find('[data-test-subj=table-wz-api-title]').text();
  const visColumns = visTable.find('[data-test-subj=table-with-search-bar] th');

  const visTables = wrapper.find('table');

  for (let i = 0; i < visTables.length; i++) {
    // This is done because the ID of the tables changes at each execution and breaks the snapshot.
    visTables[i]['attribs']['id'] = TABLE_ID;
  }

  expect(wrapper).toMatchSnapshot();
  expect(visTitle.trim()).toContain(title);
  expect(visColumns.length).toEqual(columns.length);
  for (let i = 0; i < columns.length; i++) {
    expect(visColumns.eq(i).text()).toContain(columns[i]);
  }
};
const shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderTableWithCorrectColumnsAndTitle(
    'network-ports-table',
    NETWORK_PORTS,
    AgentTabs.NETWORK,
    agent,
    columns,
  );
};

const shouldRenderNetworkInterfacesTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderTableWithCorrectColumnsAndTitle(
    'network-interfaces-table',
    NETWORK_INTERFACES,
    AgentTabs.NETWORK,
    agent,
    columns,
  );
};

const shouldRenderNetworkSettingsTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderTableWithCorrectColumnsAndTitle(
    'network-settings-table',
    NETWORK_SETTINGS,
    AgentTabs.NETWORK,
    agent,
    columns,
  );
};

const shouldRenderSoftwarePackagesTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderTableWithCorrectColumnsAndTitle(
    'software-packages-table',
    SOFTWARE_PACKAGES,
    AgentTabs.SOFTWARE,
    agent,
    columns,
  );
};

const shouldRenderSoftwareWindowsUpdatesTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderTableWithCorrectColumnsAndTitle(
    'software-windows-updates-table',
    SOFTWARE_WINDOWS_UPDATES,
    AgentTabs.SOFTWARE,
    agent,
    columns,
  );
};

describe('Inventory data', () => {
  describe('Software', () => {
    describe(SOFTWARE_PACKAGES + ' table', () => {
      it('A Linux agent should render software table with correct columns and title.', () => {
        const columns = [
          SOFTWARE_PACKAGES_COLUMNS.NAME,
          SOFTWARE_PACKAGES_COLUMNS.ARCHITECTURE,
          SOFTWARE_PACKAGES_COLUMNS.VERSION,
          SOFTWARE_PACKAGES_COLUMNS.VENDOR,
          SOFTWARE_PACKAGES_COLUMNS.DESCRIPTION,
        ];

        shouldRenderSoftwarePackagesTableWithCorrectColumnsAndTitle(
          AGENT.DEBIAN,
          columns,
        );
      });
      it('A Windows agent should render software table with correct columns and title.', () => {
        const columns = [
          SOFTWARE_PACKAGES_COLUMNS.NAME,
          SOFTWARE_PACKAGES_COLUMNS.ARCHITECTURE,
          SOFTWARE_PACKAGES_COLUMNS.VERSION,
          SOFTWARE_PACKAGES_COLUMNS.VENDOR,
        ];

        shouldRenderSoftwarePackagesTableWithCorrectColumnsAndTitle(
          AGENT.WINDOWS,
          columns,
        );
      });
      it('A Apple agent should render software table with correct columns and title.', () => {
        const columns = [
          SOFTWARE_PACKAGES_COLUMNS.NAME,
          SOFTWARE_PACKAGES_COLUMNS.VERSION,
          SOFTWARE_PACKAGES_COLUMNS.FORMAT,
          SOFTWARE_PACKAGES_COLUMNS.LOCATION,
          SOFTWARE_PACKAGES_COLUMNS.DESCRIPTION,
        ];

        shouldRenderSoftwarePackagesTableWithCorrectColumnsAndTitle(
          AGENT.DARWIN,
          columns,
        );
      });
    });

    describe(SOFTWARE_WINDOWS_UPDATES + ' table', () => {
      it('A Linux agent should render software table with correct columns and title.', () => {
        const wrapper = render(
          <SyscollectorInventory
            agent={AGENT.DEBIAN}
            section={AgentTabs.SOFTWARE}
          />,
        );
        const visTable = wrapper
          .find(`[data-test-subj=software-windows-updates-table]`)
          .first()
          .html();

        expect(visTable).toBeFalsy();
      });

      it('A Windows agent should render software table with correct columns and title.', () => {
        const columns = [SOFTWARE_WINDOWS_UPDATES_COLUMNS.UPDATE_CODE];

        shouldRenderSoftwareWindowsUpdatesTableWithCorrectColumnsAndTitle(
          AGENT.WINDOWS,
          columns,
        );
      });

      it('A Apple agent should render software table with correct columns and title.', () => {
        const wrapper = render(
          <SyscollectorInventory
            agent={AGENT.DARWIN}
            section={AgentTabs.SOFTWARE}
          />,
        );
        const visTable = wrapper
          .find(`[data-test-subj=software-windows-updates-table]`)
          .first()
          .html();

        expect(visTable).toBeFalsy();
      });
    });
  });

  describe('Network', () => {
    describe(NETWORK_SETTINGS + ' table', () => {
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
    describe(NETWORK_INTERFACES + ' table', () => {
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
    describe(NETWORK_PORTS + ' table', () => {
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
});
