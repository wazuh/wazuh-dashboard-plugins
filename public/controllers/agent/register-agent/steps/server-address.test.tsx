import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import ServerAddress from './server-address';
import * as registerAgentsUtils from '../utils';

const mockedNodesIps = [
  {
    name: 'master-node',
    type: 'master',
    version: '4.x',
    ip: 'wazuh-master',
  },
  {
    name: 'worker1',
    type: 'worker',
    version: '4.x',
    ip: '172.26.0.7',
  },
  {
    name: 'worker2',
    type: 'worker',
    version: '4.x',
    ip: '172.26.0.6',
  },
];

const mockedClusterNodes = {
  data: {
    data: {
      affected_items: mockedNodesIps,
      total_affected_items: mockedNodesIps.length,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'All selected nodes information was returned',
    error: 0,
  },
};

const promiseFetchOptions = Promise.resolve(
  registerAgentsUtils.parseNodesInOptions(mockedClusterNodes)
);
const mockedFetchOptions = () => promiseFetchOptions;

describe('Server Address Combobox', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={() =>
          Promise.resolve(registerAgentsUtils.parseNodesInOptions(mockedClusterNodes))
        }
      />
    );
    expect(container).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(
      <ServerAddress onChange={() => {}} fetchOptions={mockedFetchOptions} />
    );
    expect(container).toMatchSnapshot();
  });

  it('should set "master node" like default value when combobox is initiliazed', async () => {
    const { container, getByText } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={mockedFetchOptions}
      />
    );
    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      expect(getByText('master-node')).toBeInTheDocument();
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.results[0].value).toBe('wazuh-master');
      expect(container).toBeInTheDocument();
    });
  });

  it('should render the correct number of options', async () => {
    const { getByRole, getByText } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={mockedFetchOptions}
      />
    );
    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Open list of options'}));
      expect(getByText(mockedNodesIps[0].name)).toBeInTheDocument(); 
      mockedNodesIps.splice(1,mockedNodesIps.length).forEach(nodeItem => {
        expect(getByText(`${nodeItem.name}:${nodeItem.ip}`)).toBeInTheDocument();
      })
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.results[0].value).toBe('wazuh-master');
    });
  });

  it('should allow multiple selection and return ips delimeters by semicolon', async () => {
    const { getByRole, getByText, container, debug } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={mockedFetchOptions}
      />
    );
    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));      
      fireEvent.click(getByText(`master-node:wazuh-master`));
      fireEvent.click(getByText(`worker1:172.26.0.7`));
      fireEvent.click(getByText(`worker2:172.26.0.6`));
      expect(spy).toBeCalledTimes(5);
      expect(spy.mock.results[4].value).toBe('wazuh-master;172.26.0.7;172.26.0.6');
      expect(container).toBeInTheDocument();
    });
  });

  it('should return EMPTY parsed Node IPs when options are not selected', async () => {
    const { getByRole, container } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={mockedFetchOptions}
      />
    );
    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.results[1].value).toBe('');
      expect(container).toBeInTheDocument();
    });
  });

  it('should allow create customs options when user type and trigger enter key', async () => {
    const { getByRole } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={mockedFetchOptions}
      />
    );
    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.change(getByRole('textbox'), { target: { value: 'custom-ip-dns' }})
      fireEvent.keyDown(getByRole('textbox'), { key: 'Enter', code: 'Enter' });
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.results[1].value).toBe('wazuh-master;custom-ip-dns');
    });
  })

  it('should show "node.name:node.ip" in the combobox options', async () => {
    const { getByRole, getByText } = render(
      <ServerAddress
        onChange={() => {}}
        fetchOptions={mockedFetchOptions}
      />
    );
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
      mockedNodesIps.forEach(nodeItem => {
        expect(getByText(`${nodeItem.name}:${nodeItem.ip}`)).toBeInTheDocument();
      })
    });
  })

  it('should paste only "node.name" when is selected and return "node.ip"', async () => {
    const onChangeMocked = jest.fn();
    const { getByRole, getByText } = render(
      <ServerAddress
        onChange={onChangeMocked}
        fetchOptions={mockedFetchOptions}
      />
    );
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
      fireEvent.click(getByText(`master-node:wazuh-master`));
      fireEvent.click(getByText(`worker1:172.26.0.7`));
      fireEvent.click(getByText(`worker2:172.26.0.6`));
      expect(onChangeMocked).lastCalledWith('wazuh-master;172.26.0.7;172.26.0.6');
    });
  })
});
