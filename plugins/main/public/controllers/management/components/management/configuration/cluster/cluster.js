/*
 * Wazuh app - React component for show configuration of cluster.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import WzLoading from '../util-components/loading';
import { isString, renderValueOrNoValue } from '../utils/utils';

import { connect } from 'react-redux';

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { WzRequest } from '../../../../../../react-services/wz-request';

const mainSettings = [
  { field: 'name', label: 'Cluster name' },
  { field: 'node_name', label: 'Node name' },
  { field: 'node_type', label: 'Node type' },
  { field: 'nodes', label: 'Master node IP address' },
  { field: 'port', label: 'Port to listen to cluster communications' },
  {
    field: 'bind_addr',
    label: 'IP address to listen to cluster communications',
  },
  { field: 'hidden', label: 'Hide cluster information in alerts' },
];

const haproxySettings = [
  { field: 'haproxy_helper.haproxy_disabled', label: 'HAProxy status' },
  { field: 'haproxy_helper.haproxy_address', label: 'Address' },
  { field: 'haproxy_helper.haproxy_user', label: 'User' },
  { field: 'haproxy_helper.haproxy_password', label: 'Password' },
  { field: 'haproxy_helper.haproxy_port', label: 'Port' },
  { field: 'haproxy_helper.haproxy_protocol', label: 'Protocol' },
  { field: 'haproxy_helper.haproxy_backend', label: 'Backend' },
  { field: 'haproxy_helper.frequency', label: 'Frequency' },
  { field: 'haproxy_helper.agent_chunk_size', label: 'Agent chunk size' },
  {
    field: 'haproxy_helper.agent_reconnection_time',
    label: 'Agent reconnection time',
  },
  {
    field: 'haproxy_helper.agent_reconnection_stability_time',
    label: 'Agent reconnection stability time',
  },
  { field: 'haproxy_helper.imbalance_tolerance', label: 'Imbalance tolerance' },
  {
    field: 'haproxy_helper.remove_disconnected_node_after',
    label: 'Remove disconnected node after',
  },
  { field: 'haproxy_helper.haproxy_resolver', label: 'Resolver' },
  {
    field: 'haproxy_helper.excluded_nodes',
    label: 'Excluded nodes',
    render: renderValueOrNoValue,
  },
];

const helpLinks = [
  {
    text: 'Configuring a cluster',
    href: webDocumentationLink(
      'user-manual/wazuh-server-cluster/cluster-nodes-configuration.html',
    ),
  },
  {
    text: 'Cluster reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/cluster.html'),
  },
];

export class WzCluster extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clusterConfig: null,
      isLoading: true,
      errorFetching: null,
    };
  }

  async componentDidMount() {
    await this.fetchClusterConfig();
  }

  async componentDidUpdate(prevProps) {
    if (
      prevProps.clusterNodeSelected !== this.props.clusterNodeSelected ||
      prevProps.refreshTime !== this.props.refreshTime
    ) {
      await this.fetchClusterConfig();
    }
  }

  fetchClusterConfig = async () => {
    try {
      this.setState({ isLoading: true, errorFetching: null });
      const node = this.props.clusterNodeSelected;
      if (!node) {
        this.setState({
          isLoading: false,
          errorFetching: 'No cluster node selected',
        });
        return;
      }
      const result = await WzRequest.apiReq(
        'GET',
        `/cluster/${node}/configuration`,
        {},
      );
      const clusterConfig =
        result?.data?.data?.affected_items?.[0]?.cluster || null;
      if (clusterConfig) {
        this.setState({ clusterConfig, isLoading: false });
      } else {
        this.setState({ isLoading: false, errorFetching: 'not-present' });
      }
    } catch (error) {
      this.setState({
        isLoading: false,
        errorFetching: error.message || 'Error fetching cluster configuration',
      });
    }
  };

  render() {
    const { clusterConfig, isLoading, errorFetching } = this.state;
    const { wazuhNotReadyYet } = this.props;

    if (isLoading) {
      return <WzLoading />;
    }

    if (errorFetching && isString(errorFetching)) {
      return <WzNoConfig error={errorFetching} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && !clusterConfig) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    if (!clusterConfig) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    let mainSettingsConfig = {
      ...clusterConfig,
      disabled:
        clusterConfig.disabled === true ? 'disabled' : 'enabled',
    };

    if (clusterConfig.haproxy_helper) {
      mainSettingsConfig = {
        ...mainSettingsConfig,
        haproxy_helper: {
          ...clusterConfig.haproxy_helper,
          haproxy_disabled:
            clusterConfig.haproxy_helper.haproxy_disabled === true
              ? 'disabled'
              : 'enabled',
        },
      };
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Main settings'
          help={helpLinks}
        >
          <WzConfigurationSettingsGroup
            config={mainSettingsConfig}
            items={mainSettings}
          />
          {mainSettingsConfig.haproxy_helper && (
            <WzConfigurationSettingsGroup
              title='HAProxy settings'
              config={mainSettingsConfig}
              items={haproxySettings}
            />
          )}
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  refreshTime: state.configurationReducers.refreshTime,
});

WzCluster.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  clusterNodeSelected: PropTypes.string,
  refreshTime: PropTypes.number,
};

export default connect(mapStateToProps)(WzCluster);
