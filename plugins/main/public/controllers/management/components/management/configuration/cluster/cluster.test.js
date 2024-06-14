import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzCluster } from './cluster';

const basicClusterSettings = {
  'com-cluster': {
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

const clusterSettingsWithHaproxyHelper = {
  'com-cluster': {
    disabled: false,
    name: 'wazuh1',
    node_name: 'master',
    node_type: 'master',
    key: 'test1234',
    port: 1516,
    bind_addr: '0.0.0.0',
    nodes: ['0.0.0.0'],
    hidden: 'no',
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
      <WzCluster currentConfig={basicClusterSettings} />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Cluster status')).toBeInTheDocument();
    expect(getByTestId('cluster-status').value).toBe('enabled');
    expect(queryByText('HAProxy settings')).toBeFalsy();
  });

  it('should render the cluster settings with HAProxy helper', () => {
    const { container, getByText, getByTestId } = render(
      <WzCluster currentConfig={clusterSettingsWithHaproxyHelper} />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Cluster status')).toBeInTheDocument();
    expect(getByTestId('cluster-status').value).toBe('enabled');
    expect(getByText('HAProxy settings')).toBeInTheDocument();
    expect(getByTestId('haproxy-status').value).toBe('enabled');
    expect(getByTestId('user').value).toBe(
      clusterSettingsWithHaproxyHelper['com-cluster'].haproxy_helper
        .haproxy_user,
    );
  });

  it('should render the error message when the cluster setting is a string', () => {
    const { container, getByText, queryByText } = render(
      <WzCluster currentConfig={{ 'com-cluster': 'error message' }} />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('Cluster status')).toBeFalsy();
    expect(queryByText('HAProxy settings')).toBeFalsy();
  });
});
