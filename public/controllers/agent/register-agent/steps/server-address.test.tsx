import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServerAddress from './server-address';

import { WzRequest } from '../../../../react-services/wz-request';
import { act } from 'react-dom/test-utils';

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
  it('should render correctly', () => {
    const { container } = render(<ServerAddress onChange={() => {}} />);
    expect(container).toBeInTheDocument();
  });

  it('should render the correct number of options', async () => {
    const promise = Promise.resolve(mockedClusterNodes);
    WzRequest.apiReq = jest.fn().mockImplementation(() => promise);
    const { container, getByRole, getByText } = render(<ServerAddress onChange={() => {}} />);

    await act(async () => {
      await promise; // waiting for the combobox items are loaded
      const comboboxBtn = getByRole('button');
      fireEvent.click(comboboxBtn);
      mockedClusterNodes.data.data.affected_items.forEach((node) => {
        expect(getByText(node.name)).toBeInTheDocument();
      });
      expect(container).toBeInTheDocument();
    });
  });
});
