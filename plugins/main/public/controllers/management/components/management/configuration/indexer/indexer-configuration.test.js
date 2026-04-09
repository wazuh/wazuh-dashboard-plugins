import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzIndexer } from './indexer-configuration';
import { WzRequest } from '../../../../../../react-services/wz-request';

jest.mock('../../../../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

const basicIndexerConfig = {
  hosts: ['https://os1:9200'],
  ssl: {
    certificate_authorities: [
      { ca: ['/etc/server_certs/root-ca.pem'] },
    ],
    certificate: ['/etc/server_certs/server.pem'],
    key: ['/etc/server_certs/server-key.pem'],
  },
};

const multiHostIndexerConfig = {
  hosts: ['https://os1:9200', 'https://os2:9200'],
  ssl: {
    certificate_authorities: [
      { ca: ['/etc/server_certs/root-ca.pem', '/etc/server_certs/alt-ca.pem'] },
    ],
    certificate: ['/etc/server_certs/server.pem'],
    key: ['/etc/server_certs/server-key.pem'],
  },
};

const mockApiResponse = indexerConfig => ({
  data: {
    data: {
      affected_items: [{ indexer: indexerConfig }],
      total_affected_items: 1,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'Configuration was successfully read in specified node',
    error: 0,
  },
});

describe('Indexer settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the indexer settings', async () => {
    WzRequest.apiReq.mockResolvedValue(mockApiResponse(basicIndexerConfig));

    const { getByText } = render(
      <WzIndexer clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Hosts')).toBeInTheDocument();
    });

    expect(getByText('SSL settings')).toBeInTheDocument();
    expect(getByText('Certificate authorities')).toBeInTheDocument();
    expect(getByText('Certificate')).toBeInTheDocument();
    expect(getByText('Key')).toBeInTheDocument();
  });

  it('should render multiple hosts', async () => {
    WzRequest.apiReq.mockResolvedValue(
      mockApiResponse(multiHostIndexerConfig),
    );

    const { getByText } = render(
      <WzIndexer clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Hosts')).toBeInTheDocument();
    });

    expect(getByText('SSL settings')).toBeInTheDocument();
  });

  it('should render error when indexer config is not present', async () => {
    WzRequest.apiReq.mockResolvedValue({
      data: {
        data: {
          affected_items: [{}],
          total_affected_items: 1,
          total_failed_items: 0,
          failed_items: [],
        },
      },
    });

    const { getByText, queryByText } = render(
      <WzIndexer clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Configuration not available')).toBeInTheDocument();
    });

    expect(queryByText('Hosts')).toBeFalsy();
  });

  it('should render error when the API request fails', async () => {
    WzRequest.apiReq.mockRejectedValue(new Error('Network error'));

    const { getByText, queryByText } = render(
      <WzIndexer clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Configuration not available')).toBeInTheDocument();
    });

    expect(queryByText('Hosts')).toBeFalsy();
  });
});
