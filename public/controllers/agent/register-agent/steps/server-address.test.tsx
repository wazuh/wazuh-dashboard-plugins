import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import ServerAddress from './server-address';
import * as registerAgentsUtils from '../../components/register-agent-service';

jest.mock('../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: url => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name, value, options) => {
      return true;
    },
    get: () => {
      return '{}';
    },
    remove: () => {
      return;
    },
  }),
}));

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
  registerAgentsUtils.parseNodesInOptions(mockedClusterNodes),
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
          Promise.resolve(
            registerAgentsUtils.parseNodesInOptions(mockedClusterNodes),
          )
        }
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(
      <ServerAddress onChange={() => {}} fetchOptions={mockedFetchOptions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should set default combobox value and disable input when defaultValue is defined', async () => {
    const onChangeMocked = jest.fn();
    const { container, getByText, getByRole } = render(
      <ServerAddress
        defaultValue={'default-dns'}
        onChange={onChangeMocked}
        fetchOptions={mockedFetchOptions}
      />,
    );

    await act(async () => {
      await promiseFetchOptions;
      expect(onChangeMocked).toBeCalledTimes(1);
      expect(onChangeMocked).toBeCalledWith([
        { label: 'default-dns', value: 'default-dns', nodetype: 'custom' },
      ]);
      expect(getByText('default-dns')).toBeInTheDocument();
      expect(getByRole('textbox')).toHaveAttribute('disabled');
      expect(container).toBeInTheDocument();
    });
  });

  it('should set node type master like default value when combobox is initiliazed and not have defaultValue', async () => {
    const { container, getByText } = render(
      <ServerAddress onChange={() => {}} fetchOptions={mockedFetchOptions} />,
    );

    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      expect(getByText('master-node')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });
  });

  it('should render the correct number of options', async () => {
    const { getByRole, findByText } = render(
      <ServerAddress onChange={() => {}} fetchOptions={mockedFetchOptions} />,
    );

    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
      await findByText(`${mockedNodesIps[0].name}:${mockedNodesIps[0].ip}`);
      await findByText(`${mockedNodesIps[1].name}:${mockedNodesIps[1].ip}`);
      await findByText(`${mockedNodesIps[2].name}:${mockedNodesIps[2].ip}`);
    });
  });

  it('should allow only single selection', async () => {
    const onChangeMocked = jest.fn();
    const { getByRole, getByText, findByText } = render(
      <ServerAddress
        onChange={onChangeMocked}
        fetchOptions={mockedFetchOptions}
      />,
    );
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
      const serverAddresInput = getByRole('textbox');
      fireEvent.change(serverAddresInput, { target: { value: 'first-typed' } });
      fireEvent.keyDown(serverAddresInput, { key: 'Enter', code: 'Enter' });
      fireEvent.change(serverAddresInput, { target: { value: 'last-typed' } });
      fireEvent.keyDown(serverAddresInput, { key: 'Enter', code: 'Enter' });
      expect(onChangeMocked).toHaveBeenLastCalledWith([
        { label: 'last-typed', value: 'last-typed', nodetype: 'custom' },
      ]);
      expect(getByText('last-typed')).toBeInTheDocument();
    });
  });

  it('should return EMPTY parsed Node IPs when options are not selected', async () => {
    const onChangeMocked = jest.fn();
    const { getByRole, container } = render(
      <ServerAddress
        onChange={onChangeMocked}
        fetchOptions={mockedFetchOptions}
      />,
    );
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
      expect(onChangeMocked).toBeCalledTimes(2);
      expect(onChangeMocked).toBeCalledWith([]);
      expect(container).toBeInTheDocument();
    });
  });

  it('should allow create customs options when user type and trigger enter key', async () => {
    const onChangeMocked = jest.fn();

    const { getByRole } = render(
      <ServerAddress
        onChange={onChangeMocked}
        fetchOptions={mockedFetchOptions}
      />,
    );
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.change(getByRole('textbox'), {
        target: { value: 'custom-ip-dns' },
      });
      fireEvent.keyDown(getByRole('textbox'), { key: 'Enter', code: 'Enter' });
      expect(onChangeMocked).toBeCalledTimes(2);
      expect(onChangeMocked).toHaveBeenNthCalledWith(2, [
        { label: 'custom-ip-dns', value: 'custom-ip-dns', nodetype: 'custom' },
      ]);
    });
  });

  it('should show "node.name:node.ip" in the combobox options', async () => {
    const { getByRole, getByText } = render(
      <ServerAddress onChange={() => {}} fetchOptions={mockedFetchOptions} />,
    );
    await act(async () => {
      await promiseFetchOptions; // waiting for the combobox items are loaded
      fireEvent.click(getByRole('button', { name: 'Clear input' }));
    });

    mockedNodesIps.forEach(nodeItem => {
      expect(getByText(`${nodeItem.name}:${nodeItem.ip}`)).toBeInTheDocument();
    });
  });
});
