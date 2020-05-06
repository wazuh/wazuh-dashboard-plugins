/*
 * Wazuh app - React component for show chose section in configuration.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import WzConfigurationOverview from './configuration-overview';
import {
  WzConfigurationGlobalConfigurationManager,
  WzConfigurationGlobalConfigurationAgent
} from './global-configuration/global-configuration';
import WzConfigurationEditConfiguration from './edit-configuration/edit-configuration';
import WzConfigurationRegistrationService from './registration-service/registration-service';
import WzConfigurationLogSettings from './log-settings/log-settings';
import WzConfigurationCluster from './cluster/cluster';
import WzConfigurationAlerts from './alerts/alerts';
import WzConfigurationClient from './client/client';
import WzConfigurationClientBuffer from './client-buffer/client-buffer';
import { WzConfigurationAlertsLabelsAgent } from './alerts/alerts-labels';
import WzConfigurationIntegrations from './integrations/integrations';
import WzConfigurationPolicyMonitoring from './policy-monitoring/policy-monitoring';
import WzConfigurationOpenSCAP from './open-scap/open-scap';
import WzConfigurationCisCat from './cis-cat/cis-cat';
import WzConfigurationVulnerabilities from './vulnerabilities/vulnerabilities';
import WzConfigurationOsquery from './osquery/osquery';
import WzConfigurationInventory from './inventory/inventory';
import WzConfigurationActiveResponse from './active-response/active-response';
import WzConfigurationActiveResponseAgent from './active-response/active-response-agent';
import WzConfigurationCommands from './commands/commands';
import WzConfigurationDockerListener from './docker-listener/docker-listener';
import WzConfigurationLogCollection from './log-collection/log-collection';
import WzConfigurationIntegrityMonitoring from './integrity-monitoring/integrity-monitoring';
import WzConfigurationIntegrityAgentless from './agentless/agentless';
import WzConfigurationIntegrityAmazonS3 from './aws-s3/aws-s3';
import WzConfigurationAzureLogs from './azure-logs/azure-logs';
import WzViewSelector, {
  WzViewSelectorSwitch
} from './util-components/view-selector';
import WzLoading from './util-components/loading';
import WzConfigurationPath from './util-components/configuration-path';
import WzToastProvider from './util-providers/toast-p';
import WzRefreshClusterInfoButton from './util-components/refresh-cluster-info-button';

import { clusterNodes, checkAdminMode } from './utils/wz-fetch';
import {
  updateClusterNodes,
  updateClusterNodeSelected,
  updateAdminMode
} from '../../../../../redux/actions/configurationActions';
import { connect } from 'react-redux';

import {
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiButtonEmpty,
  EuiFlexItem
} from '@elastic/eui';

import { agentIsSynchronized } from './utils/wz-fetch';

class WzConfigurationSwitch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: '',
      viewProps: {},
      agentSynchronized: undefined
    };
  }
  componentWillUnmount() {
    this.props.updateClusterNodes(false);
    this.props.updateClusterNodeSelected(false);
  }
  updateConfigurationSection = (view, title, description) => {
    this.setState({ view, viewProps: { title: title, description } });
  };
  updateBadge = badgeStatus => {
    // default value false?
    this.setState({
      viewProps: { ...this.state.viewProps, badge: badgeStatus }
    });
  };
  async componentDidMount() {
    // Check admin mode
    try {
      const adminMode = await checkAdminMode();
      this.props.updateAdminMode(adminMode);
    } catch (error) {
      this.props.updateAdminMode(false);
    }
    // If agent, check if is synchronized or not
    if (this.props.agent.id !== '000') {
      try {
        const agentSynchronized = await agentIsSynchronized(this.props.agent);
        this.setState({ agentSynchronized });
      } catch (error) {
        // do nothing
      }
    } else {
      try {
        // try if it is a cluster
        const nodes = await clusterNodes();
        // set cluster nodes in Redux Store
        this.props.updateClusterNodes(nodes.data.data.items);
        // set cluster node selected in Redux Store
        this.props.updateClusterNodeSelected(
          nodes.data.data.items.find(node => node.type === 'master').name
        );
      } catch (error) {
        // do nothing if it isn't a cluster
        this.props.updateClusterNodes(false);
        this.props.updateClusterNodeSelected(false);
      }
    }
  }
  render() {
    const {
      view,
      viewProps: { title, description, badge },
      agentSynchronized
    } = this.state;
    const { agent, goGroups, loadingStatus } = this.props; // TODO: goGroups and exportConfiguration is used for Manager and depends of AngularJS
    return (
      <WzToastProvider>
        <EuiPage>
          <EuiPanel>
            {agent.id !== '000' && agent.group && agent.group.length ? (
              <Fragment>
                <span>Groups:</span>
                {agent.group.map((group, key) => (
                  <EuiButtonEmpty
                    key={`agent-group-${key}`}
                    onClick={() => goGroups(agent, key)}
                  >
                    {group}
                  </EuiButtonEmpty>
                ))}
                <EuiSpacer size="s" />
              </Fragment>
            ) : null}
            {view !== '' && view !== 'edit-configuration' && (
              <WzConfigurationPath
                title={title}
                description={description}
                updateConfigurationSection={this.updateConfigurationSection}
                badge={badge}
              >
                {agent.id === '000' && (
                  <EuiFlexItem grow={false}>
                    <WzRefreshClusterInfoButton />
                  </EuiFlexItem>
                )}
              </WzConfigurationPath>
            )}
            {view === '' && (
              <WzConfigurationOverview
                agent={agent}
                agentSynchronized={agentSynchronized}
                exportConfiguration={this.props.exportConfiguration}
                updateConfigurationSection={this.updateConfigurationSection}
              />
            )}
            {view === 'edit-configuration' && (
              <WzConfigurationEditConfiguration
                clusterNodeSelected={this.props.clusterNodeSelected}
                agent={agent}
                updateConfigurationSection={this.updateConfigurationSection}
              />
            )}
            {!loadingStatus ? (
              <WzViewSelector view={view}>
                <WzViewSelectorSwitch view="global-configuration">
                  <WzConfigurationGlobalConfigurationManager
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="global-configuration-agent">
                  <WzConfigurationGlobalConfigurationAgent
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="cluster">
                  <WzConfigurationCluster
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="registration-service">
                  <WzConfigurationRegistrationService
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="log-settings">
                  <WzConfigurationLogSettings
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="alerts">
                  <WzConfigurationAlerts
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="client">
                  <WzConfigurationClient
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="client-buffer">
                  <WzConfigurationClientBuffer
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="alerts-agent">
                  <WzConfigurationAlertsLabelsAgent
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="integrations">
                  <WzConfigurationIntegrations
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="policy-monitoring">
                  <WzConfigurationPolicyMonitoring
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="open-scap">
                  <WzConfigurationOpenSCAP
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="cis-cat">
                  <WzConfigurationCisCat
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="vulnerabilities">
                  <WzConfigurationVulnerabilities
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="osquery">
                  <WzConfigurationOsquery
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="inventory">
                  <WzConfigurationInventory
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="active-response">
                  <WzConfigurationActiveResponse
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="active-response-agent">
                  <WzConfigurationActiveResponseAgent
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="commands">
                  <WzConfigurationCommands
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="docker-listener">
                  <WzConfigurationDockerListener
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="log-collection">
                  <WzConfigurationLogCollection
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="integrity-monitoring">
                  <WzConfigurationIntegrityMonitoring
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="agentless">
                  <WzConfigurationIntegrityAgentless
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="aws-s3">
                  <WzConfigurationIntegrityAmazonS3
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view="azure-logs">
                  <WzConfigurationAzureLogs
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
              </WzViewSelector>
            ) : (
              <WzLoading />
            )}
          </EuiPanel>
        </EuiPage>
      </WzToastProvider>
    );
  }
}

const mapStateToProps = state => ({
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  loadingStatus: state.configurationReducers.loadingStatus,
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

const mapDispatchToProps = dispatch => ({
  updateClusterNodes: clusterNodes =>
    dispatch(updateClusterNodes(clusterNodes)),
  updateClusterNodeSelected: clusterNodeSelected =>
    dispatch(updateClusterNodeSelected(clusterNodeSelected)),
  updateAdminMode: adminMode => dispatch(updateAdminMode(adminMode))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzConfigurationSwitch);
