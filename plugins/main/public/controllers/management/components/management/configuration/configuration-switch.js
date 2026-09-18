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
import PropTypes from 'prop-types';

import WzConfigurationOverview from './configuration-overview';
import WzConfigurationEditConfiguration from './edit-configuration/edit-configuration';
import WzLoading from './util-components/loading';
import { withRenderIfOrWrapped } from './util-hocs/render-if';
import { withUserAuthorizationPrompt } from '../../../../../components/common/hocs';

import { clusterNodes as requestClusterNodes } from './utils/wz-fetch';
import {
  clearAgentReportedConfigurationCache,
  getAgentReportedConfiguration,
} from './utils/agent-config-service';
import { clearSettingsSearchDataCache } from './utils/settings-search-service';
import { PromptAgentConfigNotReported } from './util-components/prompt-agent-config-not-reported';
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
  EuiPageBody,
  EuiProgress,
} from '@elastic/eui';

import { WzRequest } from '../../../../../react-services/wz-request';
import {
  API_NAME_AGENT_STATUS,
  UI_LOGGER_LEVELS,
} from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
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
      loadingOverview: false,
      /* The agent's report is read here rather than in each section: whether
      one exists decides whether there is a configuration to show at all. The
      service caches it for the rest of the visit, so the sections opened
      afterwards cost no further request. */
      loadingAgentReport: Boolean(props.agent?.id),
      agentReport: undefined,
      agentReportUnreadable: false,
    };
  }

  readAgentReport = async () => {
    if (!this.props.agent?.id) {
      return;
    }

    this.setState({
      loadingAgentReport: true,
      agentReport: undefined,
      agentReportUnreadable: false,
    });

    try {
      const agentReport = await getAgentReportedConfiguration(
        this.props.agent.id,
      );
      this.setState({ loadingAgentReport: false, agentReport });
    } catch (error) {
      /* The sections still open: each one reports the failure with the detail
      it has, and a failed read is not the same as an agent that never
      reported. */
      this.setState({
        loadingAgentReport: false,
        agentReportUnreadable: true,
      });
      this.catchError(error, 'readAgentReport');
    }
  };

  componentWillUnmount() {
    this.resetClusterState();
    /* The sections of a visit share one read of the agent's report. Leaving
    ends the visit, so coming back reads the report again. */
    clearAgentReportedConfigurationCache();
    clearSettingsSearchDataCache();
  }

  updateConfigurationSection = (view, title, description) => {
    this.setState({ view, viewProps: { title: title, description } });
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
      await this.handleClusterNodes();
    } catch (error) {
      // Handle cluster errors
      this.resetClusterState();
      this.catchError(error, context);
    }
  };

  async componentDidMount() {
    this.updateClusterInformation('componentDidMount');
    this.readAgentReport();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.agent?.id !== prevProps.agent?.id) {
      clearAgentReportedConfigurationCache();
      clearSettingsSearchDataCache();
      this.updateClusterInformation('componentDidUpdate');
      this.readAgentReport();

      // Reset view if switching between manager/agent contexts
      const wasManager = !prevProps.agent;
      const isManager = !this.props.agent;
      if (wasManager !== isManager && this.state.view !== '') {
        this.setState({ view: '' });
      }
    }
  }

  render() {
    const { view, agentReport, agentReportUnreadable, loadingAgentReport } =
      this.state;
    const { agent } = this.props;

    if (loadingAgentReport) {
      return <EuiProgress size='xs' color='primary' />;
    }

    /* An agent that has never reported has no configuration to page through,
    so the prompt takes the place of the panel rather than sitting inside it. A
    read that failed is not the same thing, and keeps the sections available so
    each one can report what went wrong. */
    if (agentReport === null && !agentReportUnreadable) {
      return <PromptAgentConfigNotReported />;
    }

    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPanel>
            {agent?.group?.length ? (
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
            {view === '' &&
              ((!this.state.loadingOverview && (
                <WzConfigurationOverview
                  agent={agent}
                  report={agentReport}
                  updateConfigurationSection={this.updateConfigurationSection}
                  onRefreshAgentReport={this.readAgentReport}
                />
              )) || <WzLoading />)}
            {view === 'edit-configuration' && (
              <WzConfigurationEditConfiguration
                clusterNodeSelected={this.props.clusterNodeSelected}
                agent={agent}
                updateConfigurationSection={this.updateConfigurationSection}
              />
            )}
          </EuiPanel>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

WzConfigurationSwitch.propTypes = {
  agent: PropTypes.object,
  clusterNodeSelected: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  updateClusterNodes: PropTypes.func,
  updateClusterNodeSelected: PropTypes.func,
};

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
    ...(props.agent?.id
      ? [{ action: 'agent:read', resource: `agent:id:${props.agent.id}` }]
      : []),
    ...(props.agent?.group || []).map(group => ({
      action: 'agent:read',
      resource: `agent:group:${group}`,
    })),
  ]),
  withRenderIfOrWrapped(
    props => props.agent && props.agent.status !== API_NAME_AGENT_STATUS.ACTIVE,
    PromptNoActiveAgentWithoutSelect,
  ),
  connect(mapStateToProps, mapDispatchToProps),
)(WzConfigurationSwitch);
