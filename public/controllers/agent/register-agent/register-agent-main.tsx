/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { version } from '../../../../package.json';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiButtonEmpty,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiProgress,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

import {
  DeployAgentSteps,
  getOSStepContent,
  getVersionStepContent,
  getArchitectureStepContent,
  getServerAddressStepContent,
  getWazuhPasswordStepContent,
  getAgentNameAndGroupsStepContent,
  getInstallEnrollStepContent,
  getStartStepContent,
} from './steps';
import {
  iStep,
} from './services/steps-service';

type Props = {
  hasAgents(): boolean;
  addNewAgent(agent: any): void;
  reload: () => void;
  getCurrentApiAddress(): string;
  getWazuhVersion(): string;
};

interface RegisterAgentState {
  wazuhVersion: string;
  serverAddress: string;
  loading: boolean;
}

export const RegisterAgent = withErrorBoundary(
  class RegisterAgent extends Component<Props,RegisterAgentState> {
    wazuhConfig: any;
    configuration: any;
    constructor(props: Props) {
      super(props);
      this.wazuhConfig = new WazuhConfig();
      this.configuration = this.wazuhConfig.getConfig();
      this.state = {
        wazuhVersion: '',
        serverAddress: '',
        loading: false,
      };
    }

    async componentDidMount() {
      try {
        this.setState({ loading: true });
        const wazuhVersion = await this.props.getWazuhVersion();
        this.setState({
          wazuhVersion,
          loading: false,
        });
      } catch (error) {
        this.setState({
          wazuhVersion: version,
          loading: false,
        });
        const options = {
          context: `${RegisterAgent.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          display: false,
          store: false,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    render() {
      const stepsBtnsDefinitions: iStep[] = [
        {
          title: 'Choose the operating system',
          children: getOSStepContent,
        },
        {
          title: 'Choose the version',
          children: getVersionStepContent,
        },
        {
          title: 'Choose the architecture',
          children: getArchitectureStepContent,
        },
        {
          title: 'Wazuh server address',
          children: getServerAddressStepContent,
        },
        {
          title: 'Wazuh password',
          children: getWazuhPasswordStepContent,
        },
        {
          title: 'Assign a name and a group to the agent',
          children: getAgentNameAndGroupsStepContent,
        },
        {
          title: 'Install and enroll the agent',
          children: getInstallEnrollStepContent,
        },
        {
          title: 'Start the agent',
          children: getStartStepContent,
        },
      ];

      return (
        <div>
          <EuiPage restrictWidth='1000px' style={{ background: 'transparent' }}>
            <EuiPageBody>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiPanel>
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiTitle>
                          <h2>Deploy a new agent</h2>
                        </EuiTitle>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        {this.props.hasAgents() && (
                          <EuiButtonEmpty
                            size='s'
                            onClick={() => this.props.addNewAgent(false)}
                            iconType='cross'
                          >
                            Close
                          </EuiButtonEmpty>
                        )}
                        {!this.props.hasAgents() && (
                          <EuiButtonEmpty
                            size='s'
                            onClick={() => this.props.reload()}
                            iconType='refresh'
                          >
                            Refresh
                          </EuiButtonEmpty>
                        )}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer></EuiSpacer>
                    {this.state.loading && (
                      <>
                        <EuiFlexItem>
                          <EuiProgress size='xs' color='primary' />
                        </EuiFlexItem>
                        <EuiSpacer></EuiSpacer>
                      </>
                    )}

                    {!this.state.loading && (
                      <EuiFlexItem>
                        <DeployAgentSteps
                          currentConfiguration={this.configuration}
                          wazuhVersion={this.state.wazuhVersion}
                          stepConfig={stepsBtnsDefinitions}
                        />
                      </EuiFlexItem>
                    )}
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPageBody>
          </EuiPage>
        </div>
      );
    }
  },
);
