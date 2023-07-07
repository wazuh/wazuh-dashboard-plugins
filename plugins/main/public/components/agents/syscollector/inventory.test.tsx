import React from 'react';
import { render } from 'enzyme';
import { SyscollectorInventory } from './inventory';

describe('Inventory component', () => {
  it('A Linux agent should be well rendered.', () => {
    const agent = {
      os: {
        name: 'Debian GNU/Linux',
        platform: 'debian',
        uname:
          'Linux |ip-10-0-1-106 |4.9.0-9-amd64 |1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) |x86_64',
      },
      name: 'Debian agent',
    };
    const wrapper = render(<SyscollectorInventory agent={agent} />);
    const networkPortsCard = wrapper.find('.euiFlexItem--flexGrow2').last();
    const networkPortsTitle = networkPortsCard.find('.euiText--medium').text();
    const networkPortsColumns = networkPortsCard.find('th');

    const tableId = '__table_7d62db31-1cd0-11ee-8e0c-33242698a3b9';

    const tables = wrapper.find('table');

    for (let i = 0; i < tables.length; i++) {
      tables[i]['attribs']['id'] = tableId;
    }

    const columns = [
      'Local port',
      'Process',
      'PID',
      'Local IP address',
      'State',
      'Protocol',
    ];
    expect(networkPortsTitle.trim()).toEqual('Network ports');
    expect(networkPortsColumns.length).toEqual(columns.length);
    for (let i = 0; i < columns.length; i++) {
      expect(networkPortsColumns.eq(i).text()).toContain(columns[i]);
    }
    expect(wrapper).toMatchSnapshot();
  });
});
