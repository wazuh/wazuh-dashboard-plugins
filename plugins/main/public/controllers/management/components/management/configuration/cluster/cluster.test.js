import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzCluster } from './cluster';
import { WzRequest } from '../../../../../../react-services/wz-request';

jest.mock('../../../../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

const basicClusterConfig = {
  disabled: false,
  name: 'wazuh1',
  node_name: 'master',
  node_type: 'master',
  key: 'test1234',
  port: 1516,
  bind_addr: '0.0.0.0',
  nodes: ['0.0.0.0'],
  hidden: 'no',
};

const clusterConfigWithHaproxyHelper = {
  ...basicClusterConfig,
  haproxy_helper: {
    haproxy_disabled: false,
    haproxy_address: 'wazuh-proxy',
    haproxy_user: 'haproxy',
    haproxy_password: 'haproxy',
    frequency: 60,
    agent_reconnection_stability_time: 60,
    agent_chunk_size: 300,
    haproxy_protocol: 'http',
    haproxy_backend: 'wazuh_cluster',
    agent_reconnection_time: 5,
    haproxy_port: 5555,
    haproxy_resolver: null,
    imbalance_tolerance: 0.1,
    remove_disconnected_node_after: 240,
    excluded_nodes: [],
  },
};

const mockApiResponse = clusterConfig => ({
  data: {
    data: {
      affected_items: [{ cluster: clusterConfig }],
      total_affected_items: 1,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'Configuration was successfully read in specified node',
    error: 0,
  },
});

describe('Cluster settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the cluster settings', async () => {
    WzRequest.apiReq.mockResolvedValue(mockApiResponse(basicClusterConfig));

    const { container, getByText, queryByText, getByTestId } = render(
      <WzCluster clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Cluster name')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
    expect(getByTestId('cluster-name').value).toBe('wazuh1');
    expect(queryByText('HAProxy settings')).toBeFalsy();
  });

  it('should render the cluster settings with HAProxy helper', async () => {
    WzRequest.apiReq.mockResolvedValue(
      mockApiResponse(clusterConfigWithHaproxyHelper),
    );

    const { container, getByText, getByTestId } = render(
      <WzCluster clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Cluster name')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
    expect(getByTestId('cluster-name').value).toBe('wazuh1');
    expect(getByText('HAProxy settings')).toBeInTheDocument();
    expect(getByTestId('haproxy-status').value).toBe('enabled');
    expect(getByTestId('user').value).toBe(
      clusterConfigWithHaproxyHelper.haproxy_helper.haproxy_user,
    );
  });

  it('should render the error message when the API returns no cluster config', async () => {
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

    const { container, getByText, queryByText } = render(
      <WzCluster clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Configuration not available')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
    expect(queryByText('Cluster name')).toBeFalsy();
    expect(queryByText('HAProxy settings')).toBeFalsy();
  });

  it('should render the error message when the API request fails', async () => {
    WzRequest.apiReq.mockRejectedValue(new Error('Network error'));

    const { getByText, queryByText } = render(
      <WzCluster clusterNodeSelected='node01' />,
    );

    await waitFor(() => {
      expect(getByText('Configuration not available')).toBeInTheDocument();
    });

    expect(queryByText('Cluster name')).toBeFalsy();
  });
});
