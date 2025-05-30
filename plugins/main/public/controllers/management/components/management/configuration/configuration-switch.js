/*
 * Wazuh app - React component for show chose section in configuration.
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

import WzConfigurationOverview from './configuration-overview';
import {
  WzConfigurationGlobalConfigurationManager,
  WzConfigurationGlobalConfigurationAgent,
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
import WzConfigurationGoogleCloudPubSub from './google-cloud-pub-sub/google-cloud-pub-sub';
import { WzConfigurationGitHub } from './github/github';
import WzViewSelector, {
  WzViewSelectorSwitch,
} from './util-components/view-selector';
import WzLoading from './util-components/loading';
import { withRenderIfOrWrapped } from './util-hocs/render-if';
import WzConfigurationPath from './util-components/configuration-path';
import WzRefreshClusterInfoButton from './util-components/refresh-cluster-info-button';
import { withUserAuthorizationPrompt } from '../../../../../components/common/hocs';

import {
  clusterNodes as requestClusterNodes,
  clusterReq,
  agentIsSynchronized,
} from './utils/wz-fetch';
import {
  updateClusterNodes,
  updateClusterNodeSelected,
} from '../../../../../redux/actions/configurationActions';

import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiButtonEmpty,
  EuiFlexItem,
  EuiPageBody,
} from '@elastic/eui';

import { WzRequest } from '../../../../../react-services/wz-request';
import {
  API_NAME_AGENT_STATUS,
  UI_LOGGER_LEVELS,
} from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { WzConfigurationOffice365 } from './office365/office365';
import { getCore } from '../../../../../kibana-services';
import { PromptNoActiveAgentWithoutSelect } from '../../../../../components/agents/prompts';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { endpointGroups } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';

class WzConfigurationSwitch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: '',
      viewProps: {},
      agentSynchronized: undefined,
      masterNodeInfo: undefined,
      loadingOverview: this.props.agent.id === '000',
    };
  }

  componentWillUnmount() {
    this.resetClusterState();
  }

  updateConfigurationSection = (view, title, description) => {
    this.setState({ view, viewProps: { title: title, description } });
  };

  updateBadge = badgeStatus => {
    // default value false?
    this.setState({
      viewProps: { ...this.state.viewProps, badge: badgeStatus },
    });
  };

  catchError = (error, context) => {
    const options = {
      context: `${WzConfigurationSwitch.name}.${context}`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
      },
    };
    getErrorOrchestrator().handleError(options);
  };

  updateAgentSynchronization = async (/** @type {string} */ context) => {
    // If agent, check if is synchronized or not
    try {
      const agentSynchronized = await agentIsSynchronized(this.props.agent);
      this.setState({ agentSynchronized });
    } catch (error) {
      this.catchError(error, context);
    }
  };

  handleClusterNodes = async () => {
    const nodes = await requestClusterNodes();
    const clusterNodes = nodes.data.data.affected_items;

    this.props.updateClusterNodes(clusterNodes);
    const masterNode = clusterNodes.find(node => node.type === 'master');
    if (masterNode) {
      this.props.updateClusterNodeSelected(masterNode.name);
    }
  };

  resetClusterState = () => {
    this.props.updateClusterNodes(false);
    this.props.updateClusterNodeSelected(false);
  };

  updateClusterInformation = async (/** @type {string} */ context) => {
    try {
      // try if it is a cluster
      const clusterStatus = await clusterReq();
      const isCluster =
        clusterStatus.data.data.enabled === 'yes' &&
        clusterStatus.data.data.running === 'yes';

      if (isCluster) {
        await this.handleClusterNodes();
      } else {
        // do nothing if it isn't a cluster
        this.resetClusterState();
      }
    } catch (error) {
      // do nothing if it isn't a cluster
      this.resetClusterState();
      this.catchError(error, context);
    }
  };

  fetchMasterNodeInfo = async (/** @type {string} */ context) => {
    this.setState({ loadingOverview: true });

    try {
      const masterNodeInfo = await WzRequest.apiReq(
        'GET',
        '/agents?agents_list=000',
        {},
      );
      const masterNode = masterNodeInfo.data.data.affected_items[0];
      this.setState({ masterNodeInfo: masterNode });
    } catch (error) {
      this.catchError(error, context);
    } finally {
      this.setState({ loadingOverview: false });
    }
  };

  handleAgentOrClusterUpdate = (/** @type {string} */ context) => {
    if (this.props.agent.id !== '000') {
      this.updateAgentSynchronization(context);
    } else {
      this.updateClusterInformation(context);
      this.fetchMasterNodeInfo();
    }
  };

  async componentDidMount() {
    this.handleAgentOrClusterUpdate('componentDidMount');
  }

  async componentDidUpdate(prevProps) {
    if (this.props.agent.id !== prevProps.agent.id) {
      this.handleAgentOrClusterUpdate('componentDidUpdate');
    }
  }

  render() {
    const {
      view,
      viewProps: { title, description, badge },
      agentSynchronized,
      masterNodeInfo,
    } = this.state;
    const { agent } = this.props; // TODO: goGroups and exportConfiguration is used for Manager and depends of AngularJS
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPanel>
            {agent.id !== '000' && agent.group?.length ? (
              <Fragment>
                <span>Groups:</span>
                <RedirectAppLinks application={getCore().application}>
                  {agent.group.map((group, key) => (
                    <EuiButtonEmpty
                      key={`agent-group-${key}`}
                      href={NavigationService.getInstance().getUrlForApp(
                        endpointGroups.id,
                        { path: `#/manager/?tab=groups&group=${group}` },
                      )}
                    >
                      {group}
                    </EuiButtonEmpty>
                  ))}
                  <EuiSpacer size='s' />
                </RedirectAppLinks>
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
            {view === '' &&
              ((!this.state.loadingOverview && (
                <WzConfigurationOverview
                  agent={masterNodeInfo || agent}
                  agentSynchronized={agentSynchronized}
                  updateConfigurationSection={this.updateConfigurationSection}
                />
              )) || <WzLoading />)}
            {view === 'edit-configuration' && (
              <WzConfigurationEditConfiguration
                clusterNodeSelected={this.props.clusterNodeSelected}
                agent={agent}
                updateConfigurationSection={this.updateConfigurationSection}
              />
            )}
            {view !== '' && (
              <WzViewSelector view={view}>
                <WzViewSelectorSwitch view='global-configuration'>
                  <WzConfigurationGlobalConfigurationManager
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='global-configuration-agent'>
                  <WzConfigurationGlobalConfigurationAgent
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='cluster'>
                  <WzConfigurationCluster
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='registration-service'>
                  <WzConfigurationRegistrationService
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='log-settings'>
                  <WzConfigurationLogSettings
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='alerts'>
                  <WzConfigurationAlerts
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='client'>
                  <WzConfigurationClient
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='client-buffer'>
                  <WzConfigurationClientBuffer
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='alerts-agent'>
                  <WzConfigurationAlertsLabelsAgent
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='integrations'>
                  <WzConfigurationIntegrations
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='policy-monitoring'>
                  <WzConfigurationPolicyMonitoring
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='open-scap'>
                  <WzConfigurationOpenSCAP
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='cis-cat'>
                  <WzConfigurationCisCat
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='vulnerabilities'>
                  <WzConfigurationVulnerabilities
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='osquery'>
                  <WzConfigurationOsquery
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='inventory'>
                  <WzConfigurationInventory
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='active-response'>
                  <WzConfigurationActiveResponse
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='active-response-agent'>
                  <WzConfigurationActiveResponseAgent
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='commands'>
                  <WzConfigurationCommands
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='docker-listener'>
                  <WzConfigurationDockerListener
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='log-collection'>
                  <WzConfigurationLogCollection
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='integrity-monitoring'>
                  <WzConfigurationIntegrityMonitoring
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='agentless'>
                  <WzConfigurationIntegrityAgentless
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='aws-s3'>
                  <WzConfigurationIntegrityAmazonS3
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='azure-logs'>
                  <WzConfigurationAzureLogs
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='gcp-pubsub'>
                  <WzConfigurationGoogleCloudPubSub
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='github'>
                  <WzConfigurationGitHub
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
                <WzViewSelectorSwitch view='office365'>
                  <WzConfigurationOffice365
                    clusterNodeSelected={this.props.clusterNodeSelected}
                    agent={agent}
                    updateBadge={this.updateBadge}
                    updateConfigurationSection={this.updateConfigurationSection}
                  />
                </WzViewSelectorSwitch>
              </WzViewSelector>
            )}
          </EuiPanel>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => ({
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

const mapDispatchToProps = dispatch => ({
  updateClusterNodes: clusterNodes =>
    dispatch(updateClusterNodes(clusterNodes)),
  updateClusterNodeSelected: clusterNodeSelected =>
    dispatch(updateClusterNodeSelected(clusterNodeSelected)),
});

export default compose(
  withUserAuthorizationPrompt(props => [
    props.agent.id === '000'
      ? { action: 'manager:read', resource: '*:*:*' }
      : [
          { action: 'agent:read', resource: `agent:id:${props.agent.id}` },
          ...(props.agent.group || []).map(group => ({
            action: 'agent:read',
            resource: `agent:group:${group}`,
          })),
        ],
  ]), //TODO: this need cluster:read permission but manager/cluster is managed in WzConfigurationSwitch component
  withRenderIfOrWrapped(
    props =>
      props.agent.id !== '000' &&
      props.agent.status !== API_NAME_AGENT_STATUS.ACTIVE,
    PromptNoActiveAgentWithoutSelect,
  ),
  connect(mapStateToProps, mapDispatchToProps),
)(WzConfigurationSwitch);
