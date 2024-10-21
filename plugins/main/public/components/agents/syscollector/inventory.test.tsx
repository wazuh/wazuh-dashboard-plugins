import React from 'react';
import { render } from 'enzyme';
import { SyscollectorInventory } from './inventory';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';

// TODO: Fix this test
describe('Inventory component', () => {
  it('A Linux agent should be well rendered.', () => {
    const agent = {
      os: {
        uname:
          'Linux |ip-10-0-1-106 |4.9.0-9-amd64 |1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) |x86_64',
      },
    };
    const wrapper = render(
      <SyscollectorInventory agent={agent} section={AgentTabs.NETWORK} />,
    );
    const networkPortsCard = wrapper.find('.euiFlexItem--flexGrow2').last();
    const networkPortsTitle = networkPortsCard
      .find('.euiTitle.euiTitle--small')
      .text();
    const networkPortsColumns = networkPortsCard.find('th');

    // This is done because the ID of the tables changes at each execution and breaks the snapshot.

    const tableId = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';

    const tables = wrapper.find('table');

    for (let i = 0; i < tables.length; i++) {
      tables[i]['attribs']['id'] = tableId;
    }

    const columns = [
      'Local port',
      'Local IP address',
      'Process',
      'PID',
      'State',
      'Protocol',
    ];

    expect(wrapper).toMatchSnapshot();
    expect(networkPortsTitle.trim()).toContain('Network ports');
    expect(networkPortsColumns.length).toEqual(columns.length);
    for (let i = 0; i < columns.length; i++) {
      expect(networkPortsColumns.eq(i).text()).toContain(columns[i]);
    }
  });

  it('A Windows agent should be well rendered.', () => {
    const agent = {
      os: {
        platform: 'windows',
      },
    };
    const wrapper = render(
      <SyscollectorInventory agent={agent} section={AgentTabs.NETWORK} />,
    );
    const networkPortsCard = wrapper.find('.euiFlexItem--flexGrow2').last();
    const networkPortsTitle = networkPortsCard
      .find('.euiTitle.euiTitle--small')
      .text();
    const networkPortsColumns = networkPortsCard.find('th');

    // This is done because the ID of the tables changes at each execution and breaks the snapshot.

    const tableId = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';

    const tables = wrapper.find('table');

    for (let i = 0; i < tables.length; i++) {
      tables[i]['attribs']['id'] = tableId;
    }

    const columns = [
      'Local port',
      'Local IP address',
      'Process',
      'State',
      'Protocol',
    ];

    expect(wrapper).toMatchSnapshot();
    expect(networkPortsTitle.trim()).toContain('Network ports');
    expect(networkPortsColumns.length).toEqual(columns.length);
    for (let i = 0; i < columns.length; i++) {
      expect(networkPortsColumns.eq(i).text()).toContain(columns[i]);
    }
  });

  it('A Apple agent should be well rendered.', () => {
    const agent = {
      os: {
        platform: 'darwin',
      },
    };
    const wrapper = render(
      <SyscollectorInventory agent={agent} section={AgentTabs.NETWORK} />,
    );
    const networkPortsCard = wrapper.find('.euiFlexItem--flexGrow2').last();
    const networkPortsTitle = networkPortsCard
      .find('.euiTitle.euiTitle--small')
      .text();
    const networkPortsColumns = networkPortsCard.find('th');

    // This is done because the ID of the tables changes at each execution and breaks the snapshot.

    const tableId = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';

    const tables = wrapper.find('table');

    for (let i = 0; i < tables.length; i++) {
      tables[i]['attribs']['id'] = tableId;
    }

    const columns = ['Local port', 'Local IP address', 'State', 'Protocol'];

    expect(wrapper).toMatchSnapshot();
    expect(networkPortsTitle.trim()).toContain('Network ports');
    expect(networkPortsColumns.length).toEqual(columns.length);
    for (let i = 0; i < columns.length; i++) {
      expect(networkPortsColumns.eq(i).text()).toContain(columns[i]);
    }
  });
});
