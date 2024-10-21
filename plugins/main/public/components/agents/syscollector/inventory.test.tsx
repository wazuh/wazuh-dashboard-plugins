import React from 'react';
import { render } from 'enzyme';
import { SyscollectorInventory } from './inventory';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';

const TABLE_ID = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';
const NETWORK_PORTS = 'Network ports';

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

const COLUMNS = {
  LOCAL_PORT: 'Local port',
  LOCAL_IP: 'Local IP address',
  PROCESS: 'Process',
  PID: 'PID',
  STATE: 'State',
  PROTOCOL: 'Protocol',
} as const;

const shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle = (
  agent: (typeof AGENT)[keyof typeof AGENT],
  columns: string[],
) => {
  const wrapper = render(
    <SyscollectorInventory agent={agent} section={AgentTabs.NETWORK} />,
  );
  const networkPortsTable = wrapper
    .find('[data-test-subj=network-ports-table]')
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
  expect(networkPortsTitle.trim()).toContain(NETWORK_PORTS);
  expect(networkPortsColumns.length).toEqual(columns.length);
  for (let i = 0; i < columns.length; i++) {
    expect(networkPortsColumns.eq(i).text()).toContain(columns[i]);
  }
};

describe('NetworkPortsTable', () => {
  it('A Linux agent should render network ports table with correct columns and title.', () => {
    const columns = [
      COLUMNS.LOCAL_PORT,
      COLUMNS.LOCAL_IP,
      COLUMNS.PROCESS,
      COLUMNS.PID,
      COLUMNS.STATE,
      COLUMNS.PROTOCOL,
    ];

    shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle(
      AGENT.DEBIAN,
      columns,
    );
  });

  it('A Windows agent should render network ports table with correct columns and title.', () => {
    const columns = [
      COLUMNS.LOCAL_PORT,
      COLUMNS.LOCAL_IP,
      COLUMNS.PROCESS,
      COLUMNS.STATE,
      COLUMNS.PROTOCOL,
    ];
    shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle(
      AGENT.WINDOWS,
      columns,
    );
  });

  it('A Apple agent should render network ports table with correct columns and title.', () => {
    const columns = [
      COLUMNS.LOCAL_PORT,
      COLUMNS.LOCAL_IP,
      COLUMNS.STATE,
      COLUMNS.PROTOCOL,
    ];

    shouldRenderNetworkPortsTableWithCorrectColumnsAndTitle(
      AGENT.DARWIN,
      columns,
    );
  });
});
