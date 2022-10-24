import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import ServerAddress from './server-address';
import * as registerAgentsUtils from '../utils';

import { WzRequest } from '../../../../react-services/wz-request';
jest.mock('../../../../react-services/wz-request');

const mockedClusterNodes = {
  data: {
    data: {
      affected_items: [
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
      ],
      total_affected_items: 3,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'All selected nodes information was returned',
    error: 0,
  },
};

describe('Server Address Combobox', () => {

  afterEach(() => {    
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<ServerAddress onChange={() => {}} />);
    expect(container).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<ServerAddress onChange={() => {}} />);
    expect(container).toMatchSnapshot();
  })

  it('should render the correct number of options', async () => {
    const promise = Promise.resolve(mockedClusterNodes);
    WzRequest.apiReq = jest.fn().mockImplementation(() => promise);
    const { container, getByRole, getByText } = render(<ServerAddress onChange={() => {}} />);

    await act(async () => {
      await promise; // waiting for the combobox items are loaded
      const comboboxBtn = getByRole('button');
      fireEvent.click(comboboxBtn);
      mockedClusterNodes.data.data.affected_items.forEach((node) => {
        expect(getByText(`${node.name}: ${node.ip}`)).toBeInTheDocument();
      });
      expect(container).toBeInTheDocument();
    });
  });

  it('should return parsed Node IPs when combobox changes', async () => {
    const promise = Promise.resolve(mockedClusterNodes);
    WzRequest.apiReq = jest.fn().mockImplementation(() => promise);
    const { container, getByRole, getByText } = render(
      <ServerAddress onChange={() => {}} />
    );

    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');

    await act(async () => {
      await promise; // waiting for the combobox items are loaded
      const comboboxBtn = getByRole('button');
      fireEvent.click(comboboxBtn);
      fireEvent.click(getByText('master-node: wazuh-master'));
      fireEvent.click(getByText('worker1: 172.26.0.7'));
      fireEvent.click(getByText('worker2: 172.26.0.6'));
      expect(spy).toBeCalledTimes(3);
      expect(spy.mock.results[2].value).toBe('wazuh-master;172.26.0.7;172.26.0.6');
      expect(container).toBeInTheDocument();
    });
  });

  it('should no return EMPTY parsed Node IPs when combobox is empty', async () => {
    const promise = Promise.resolve(mockedClusterNodes);
    WzRequest.apiReq = jest.fn().mockImplementation(() => promise);
    const { container, getByRole, getByText } = render(
      <ServerAddress onChange={() => {}} />
    );

    const spy = jest.spyOn(registerAgentsUtils, 'parseNodeIPs');

    await act(async () => {
      await promise; // waiting for the combobox items are loaded
      const comboboxBtn = getByRole('button');
      fireEvent.click(comboboxBtn);
      fireEvent.click(getByText('master-node: wazuh-master'));
      const clearBtn = getByRole('button', { name: 'Clear input' });
      fireEvent.click(clearBtn);
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.results[1].value).toBe('');
      expect(container).toBeInTheDocument();
    });
  });

  it('should mark combobox like INVALID when received an invalid option', async () => {
    const promise = Promise.resolve(mockedClusterNodes);
    const { container, getByRole } = render(
      <ServerAddress onChange={() => {}} />
    );

    await act(async () => {
      await promise; // waiting for the combobox items are loaded
      const comboboxInput = getByRole('textbox');
      fireEvent.change(comboboxInput, { target: { value: 'invalid-option' } });
      const invalidDivs = container.getElementsByClassName('euiComboBox-isInvalid');
      expect(invalidDivs.length).toBe(1);
    });
  });
});
