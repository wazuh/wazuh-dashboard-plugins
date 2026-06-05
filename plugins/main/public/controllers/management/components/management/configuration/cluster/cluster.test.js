import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzCluster } from './cluster';

const basicClusterConfig = {
  cluster: {
    disabled: false,
    name: 'wazuh1',
    node_name: 'master',
    node_type: 'master',
    key: 'test1234',
    port: 1516,
    bind_addr: '0.0.0.0',
    nodes: ['0.0.0.0'],
    hidden: 'no',
  },
};

const clusterConfigWithHaproxyHelper = {
  cluster: {
    ...basicClusterConfig.cluster,
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
  },
};

describe('Cluster settings', () => {
  it('should render the cluster settings', () => {
    const { container, getByText, queryByText, getByTestId } = render(
      <WzCluster currentConfig={basicClusterConfig} />,
    );

    expect(container).toMatchSnapshot();
    expect(getByText('Cluster name')).toBeInTheDocument();
    expect(getByTestId('cluster-name').value).toBe('wazuh1');
    expect(queryByText('HAProxy settings')).toBeFalsy();
  });

  it('should render the cluster settings with HAProxy helper', () => {
    const { container, getByText, getByTestId } = render(
      <WzCluster currentConfig={clusterConfigWithHaproxyHelper} />,
    );

    expect(container).toMatchSnapshot();
    expect(getByText('Cluster name')).toBeInTheDocument();
    expect(getByTestId('cluster-name').value).toBe('wazuh1');
    expect(getByText('HAProxy settings')).toBeInTheDocument();
    expect(getByTestId('haproxy-status').value).toBe('enabled');
    expect(getByTestId('user').value).toBe(
      clusterConfigWithHaproxyHelper.cluster.haproxy_helper.haproxy_user,
    );
  });

  it('should render the error message when cluster config is empty', () => {
    const { container, getByText, queryByText } = render(
      <WzCluster currentConfig={{ cluster: {} }} />,
    );

    expect(container).toMatchSnapshot();
    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('Cluster name')).toBeFalsy();
    expect(queryByText('HAProxy settings')).toBeFalsy();
  });

  it('should render the error message when cluster config is a string (error)', () => {
    const { getByText, queryByText } = render(
      <WzCluster currentConfig={{ cluster: 'Fetch error message' }} />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('Cluster name')).toBeFalsy();
  });
});
