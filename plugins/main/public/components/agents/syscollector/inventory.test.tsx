import React from 'react';
import { render } from 'enzyme';
import { SyscollectorInventory } from './inventory';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { AGENT } from '../../../../test/__mocks__/agent';

const TABLE_ID = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';
const SOFTWARE_PACKAGES = 'Packages';
const SOFTWARE_WINDOWS_UPDATES = 'Windows updates';
const NETWORK_PORTS = 'Network ports';
const NETWORK_INTERFACES = 'Network interfaces';
const NETWORK_SETTINGS = 'Network settings';
const PROCESSES = 'Processes';

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

const PROCESSES_COLUMNS = {
  NAME: 'Name',
  EFFECTIVE_USER: 'Effective user',
  EFFECTIVE_GROUP: 'Effective group',
  PID: 'PID',
  PARENT_PID: 'Parent PID',
  COMMAND: 'Command',
  ARGVS: 'Argvs',
  SIZE: 'Size',
  VM_SIZE: 'VM size',
  SESSION: 'Session',
  PRIORITY: 'Priority',
  STATE: 'State',
  NLWP: 'NLWP',
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
  const visTable = wrapper.find(queryDataTestAttr(dataTestId)).first();
  const visTitle = visTable
    .find(queryDataTestAttr('table-wz-api-title'))
    .text();
  const visColumns = visTable.find(
    queryDataTestAttr('table-with-search-bar') + ' .euiTableHeaderCell',
  );

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

const shouldRenderProcessesTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  shouldRenderTableWithCorrectColumnsAndTitle(
    'processes-table',
    PROCESSES,
    AgentTabs.PROCESSES,
    agent,
    columns,
  );
};

function findAgentInfo(wrapper: cheerio.Cheerio): any {
  return wrapper.find(queryDataTestAttr('agent-info')).html();
}

describe('Inventory data', () => {
  describe('Agent info', () => {
    it("A Linux agent shouldn't render agent info", () => {
      let wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DEBIAN}
          section={AgentTabs.SOFTWARE}
        />,
      );

      let agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();

      wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DEBIAN}
          section={AgentTabs.NETWORK}
        />,
      );

      agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();

      wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DEBIAN}
          section={AgentTabs.PROCESSES}
        />,
      );

      agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();
    });

    it("A Windows agent shouldn't render agent info", () => {
      let wrapper = render(
        <SyscollectorInventory
          agent={AGENT.WINDOWS}
          section={AgentTabs.SOFTWARE}
        />,
      );

      let agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();

      wrapper = render(
        <SyscollectorInventory
          agent={AGENT.WINDOWS}
          section={AgentTabs.NETWORK}
        />,
      );

      agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();

      wrapper = render(
        <SyscollectorInventory
          agent={AGENT.WINDOWS}
          section={AgentTabs.PROCESSES}
        />,
      );

      agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();
    });

    it("A Apple agent shouldn't render agent info", () => {
      let wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DARWIN}
          section={AgentTabs.SOFTWARE}
        />,
      );

      let agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();

      wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DARWIN}
          section={AgentTabs.NETWORK}
        />,
      );

      agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();

      wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DARWIN}
          section={AgentTabs.PROCESSES}
        />,
      );

      agentInfo = findAgentInfo(wrapper);

      expect(agentInfo).toBeFalsy();
    });
  });

  describe('Software', () => {
    it('should render inventory metrics', () => {
      const wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DEBIAN}
          section={AgentTabs.SOFTWARE}
        />,
      );

      const inventoryMetrics = wrapper.find(
        queryDataTestAttr('syscollector-metrics'),
      );

      expect(inventoryMetrics).toBeTruthy();
    });

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
          .find(queryDataTestAttr('software-windows-updates-table]'))
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
          .find(queryDataTestAttr('software-windows-updates-table'))
          .first()
          .html();

        expect(visTable).toBeFalsy();
      });
    });
  });

  describe('Network', () => {
    it('should render inventory metrics', () => {
      const wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DEBIAN}
          section={AgentTabs.SOFTWARE}
        />,
      );

      const inventoryMetrics = wrapper.find(
        queryDataTestAttr('syscollector-metrics'),
      );

      expect(inventoryMetrics).toBeTruthy();
    });

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

  describe('Processes', () => {
    it('should render inventory metrics', () => {
      const wrapper = render(
        <SyscollectorInventory
          agent={AGENT.DEBIAN}
          section={AgentTabs.SOFTWARE}
        />,
      );

      const inventoryMetrics = wrapper.find(
        queryDataTestAttr('syscollector-metrics'),
      );

      expect(inventoryMetrics).toBeTruthy();
    });

    it('A Linux agent should render processes table with correct columns and title.', () => {
      const columns = [
        PROCESSES_COLUMNS.NAME,
        PROCESSES_COLUMNS.EFFECTIVE_USER,
        PROCESSES_COLUMNS.EFFECTIVE_GROUP,
        PROCESSES_COLUMNS.PID,
        PROCESSES_COLUMNS.PARENT_PID,
        PROCESSES_COLUMNS.VM_SIZE,
        PROCESSES_COLUMNS.SIZE,
        PROCESSES_COLUMNS.SESSION,
        PROCESSES_COLUMNS.PRIORITY,
        PROCESSES_COLUMNS.STATE,
        PROCESSES_COLUMNS.COMMAND,
        PROCESSES_COLUMNS.ARGVS,
      ];

      shouldRenderProcessesTableWithCorrectColumnsAndTitle(
        AGENT.DEBIAN,
        columns,
      );
    });

    it('A Windows agent should render processes table with correct columns and title.', () => {
      const columns = [
        PROCESSES_COLUMNS.NAME,
        PROCESSES_COLUMNS.PID,
        PROCESSES_COLUMNS.PARENT_PID,
        PROCESSES_COLUMNS.VM_SIZE,
        PROCESSES_COLUMNS.PRIORITY,
        PROCESSES_COLUMNS.NLWP,
        PROCESSES_COLUMNS.COMMAND,
      ];

      shouldRenderProcessesTableWithCorrectColumnsAndTitle(
        AGENT.WINDOWS,
        columns,
      );
    });

    it('A Apple agent should render processes table with correct columns and title.', () => {
      const columns = [
        PROCESSES_COLUMNS.NAME,
        PROCESSES_COLUMNS.EFFECTIVE_USER,
        PROCESSES_COLUMNS.PID,
        PROCESSES_COLUMNS.PARENT_PID,
        PROCESSES_COLUMNS.VM_SIZE,
        PROCESSES_COLUMNS.PRIORITY,
      ];

      shouldRenderProcessesTableWithCorrectColumnsAndTitle(
        AGENT.DARWIN,
        columns,
      );
    });
  });
});
