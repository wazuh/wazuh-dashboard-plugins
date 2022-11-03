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
import React, { Component, Fragment } from 'react';
import { version } from '../../../../package.json';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import {
  EuiSteps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiButtonGroup,
  EuiText,
  EuiCodeBlock,
  EuiTitle,
  EuiButtonEmpty,
  EuiCopy,
  EuiPage,
  EuiPageBody,
  EuiCallOut,
  EuiSpacer,
  EuiProgress,
  EuiIcon
} from '@elastic/eui';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { 
  architectureButtons, 
  architectureCentos5OrRedHat5, 
  osButtons, 
  versionButtonsCentosOrRedHat} from './config'
import { AgentGroup, InstallEnrollAgent, ServerAddress, StartAgentTabs, WazuhPassword } from './steps'
import { getGroups, 
  getAuthInfo, 
  systemSelector,
  checkMissingOSSelection,
  getCommandText,
  getHighlightCodeLanguage } from './services/register-agent-service'


type Props = {
  hasAgents(): boolean;
  addNewAgent(agent: any): void;
  reload: () => void;
  getCurrentApiAddress(): string;
  getWazuhVersion(): string;
}

type State = {
  status: string;
  selectedOS: string;
  selectedSYS: string;
  selectedArchitecture: string;
  selectedVersion: string;
  serverAddress: string | false;
  groups: { label: string, id: string }[];
  selectedGroup: { label: string, id: string }[];
  udpProtocol: boolean;
  showPassword: boolean;
  wazuhVersion: string;
  wazuhPassword: string;
  version: string;
  loading: boolean;
  gotErrorRegistrationServiceInfo?: boolean;
  needsPassword?: boolean;
  hidePasswordInput?: boolean;
}

type OSSystems = 'rpm' | 'deb' | 'macos' | 'win';

export const RegisterAgent = withErrorBoundary(
  class RegisterAgent extends Component<Props, State> {
    wazuhConfig: any;
    configuration: any;
    restartAgentCommand: { [key: string]: string };
    constructor(props: Props) {
      super(props);
      this.wazuhConfig = new WazuhConfig();
      this.configuration = this.wazuhConfig.getConfig();
      this.state = {
        status: 'incomplete',
        selectedOS: '',
        selectedSYS: '',
        selectedArchitecture: '',
        selectedVersion: '',
        version: '',
        wazuhVersion: '',
        serverAddress: '',
        wazuhPassword: '',
        groups: [],
        selectedGroup: [],
        udpProtocol: false,
        showPassword: false,
        loading: false
      };
      this.restartAgentCommand = {
        rpm: systemSelector(this.state.selectedOS, this.state.selectedSYS),
        deb: systemSelector(this.state.selectedOS, this.state.selectedSYS),
        macos: 'sudo /Library/Ossec/bin/wazuh-control start',
        win: 'NET START WazuhSvc'
      };
    }

    async componentDidMount() {
      try {
        this.setState({ loading: true });
        const wazuhVersion = await this.props.getWazuhVersion();
        let serverAddress = false;
        let wazuhPassword = '';
        let hidePasswordInput = false;
        serverAddress = this.configuration['enrollment.dns'] || false;
        if (!serverAddress) {
          serverAddress = await this.props.getCurrentApiAddress();
        }
        let authInfo = await getAuthInfo();
        if(!authInfo  || authInfo?.error){
          this.setState({ gotErrorRegistrationServiceInfo: true });
        }
        const needsPassword = (authInfo.auth || {}).use_password === 'yes';
        if (needsPassword) {
          wazuhPassword = this.configuration['enrollment.password'] || authInfo['authd.pass'] || '';
          if (wazuhPassword) {
            hidePasswordInput = true;
          }
        }
        const groups = await getGroups();
        this.setState({
          serverAddress,
          needsPassword,
          hidePasswordInput,
          versionButtonsCentosOrRedHat,
          architectureButtons,
          architectureCentos5OrRedHat5,
          wazuhPassword,
          wazuhVersion,
          groups,
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

    selectOS(os: string) {
      this.setState({
        selectedOS: os,
        selectedVersion: '',
        selectedArchitecture: '',
        selectedSYS: 'systemd',
      });
    }

    selectSYS(sys: string) {
      this.setState({ selectedSYS: sys });
    }

    setServerAddress = (serverAddress: string) => {
      this.setState({ serverAddress });
    }

    setGroupName = (selectedGroup: {label: string, id: string}[]) => {
      this.setState({ selectedGroup });
    }

    setArchitecture(selectedArchitecture: string) {
      this.setState({ selectedArchitecture });
    }

    setVersion(selectedVersion: string) {
      this.setState({ selectedVersion, selectedArchitecture: '' });
    }

    setWazuhPassword(event: any) {
      this.setState({ wazuhPassword: event.target.value });
    }

    setShowPassword(event: any) {
      this.setState({ showPassword: event.target.checked });
    }

    render() {
      const missingOSSelection = checkMissingOSSelection(this.state.selectedOS, this.state.selectedVersion, this.state.selectedArchitecture);
      const language = getHighlightCodeLanguage(this.state.selectedOS);

      const Commandtext = getCommandText({ ...this.state });
      const restartAgentCommand = this.restartAgentCommand[this.state.selectedOS];
      const onTabClick = (selectedTab: {label: string, id: string}) => {
        this.selectSYS(selectedTab.id);
      };

      const calloutErrorRegistrationServiceInfo = this.state.gotErrorRegistrationServiceInfo ? (
        <EuiCallOut
          color="danger"
          title='This section could not be displayed because you do not have permission to get access to the registration service.'
          iconType="iInCircle"
        />
      ) : null;


      const steps = [
        {
          title: 'Choose the Operating system',
          children: (
            <EuiButtonGroup
              color="primary"
              legend="Choose the Operating system"
              options={osButtons}
              idSelected={this.state.selectedOS}
              onChange={(os) => this.selectOS(os)}
            />
          ),
        },
        ...(this.state.selectedOS == 'rpm'
          ? [
            {
              title: 'Choose the version',
              children: (
                <EuiButtonGroup
                  color="primary"
                  legend="Choose the version"
                  options={versionButtonsCentosOrRedHat}
                  idSelected={this.state.selectedVersion}
                  onChange={(version) => this.setVersion(version)}
                />
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'rpm' && this.state.selectedVersion == 'centos5' || this.state.selectedVersion == 'redhat5' 
          ? [
            {
              title: 'Choose the architecture',
              children: (
                <EuiButtonGroup
                  color="primary"
                  legend="Choose the architecture"
                  options={architectureCentos5OrRedHat5}
                  idSelected={this.state.selectedArchitecture}
                  onChange={(architecture) => this.setArchitecture(architecture)}
                />
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'deb' ||
          (this.state.selectedOS == 'rpm' && this.state.selectedVersion == 'centos6' || this.state.selectedVersion == 'redhat6')
          ? [
            {
              title: 'Choose the architecture',
              children: (
                <EuiButtonGroup
                  color="primary"
                  legend="Choose the architecture"
                  options={architectureButtons}
                  idSelected={this.state.selectedArchitecture}
                  onChange={(architecture) => this.setArchitecture(architecture)}
                />
              ),
            },
          ]
          : []),
        {
          title: 'Wazuh server address',
          children: <Fragment><ServerAddress defaultValue={this.state.serverAddress} onChange={this.setServerAddress}/></Fragment>,
        },
        ...(!(!this.state.needsPassword || this.state.hidePasswordInput)
          ? [
            {
              title: 'Wazuh password',
              children: 
                <Fragment>
                  <WazuhPassword 
                    defaultValue={this.state.wazuhPassword}
                    onChange={ (value: string) => this.setWazuhPassword(value) }/>
                </Fragment>,
            },
          ]
          : []),
        {
          title: 'Assign the agent to a group',
          children: <Fragment><AgentGroup options={this.state.groups} onChange={this.setGroupName}/></Fragment>,
        },
        {
          title: 'Install and enroll the agent',
          children: this.state.gotErrorRegistrationServiceInfo ?
            calloutErrorRegistrationServiceInfo
            : missingOSSelection.length ? (
              <EuiCallOut
                color="warning"
                title={`Please select the ${missingOSSelection.join(', ')}.`}
                iconType="iInCircle"
              />
            ) : (
              <div>
                <InstallEnrollAgent 
                  language={language}
                  commandText={Commandtext}
                  {...this.state}
                  onSetShowPassword={this.setShowPassword}
                />
              </div>
            ),
        },
        ...(this.state.selectedOS == 'rpm' || this.state.selectedOS == 'deb'
          ? [
            {
              title: 'Start the agent',
              children: this.state.gotErrorRegistrationServiceInfo ?
                calloutErrorRegistrationServiceInfo
                : missingOSSelection.length ? (
                  <EuiCallOut
                    color="warning"
                    title={`Please select the ${missingOSSelection.join(', ')}.`}
                    iconType="iInCircle"
                  />
                ) : (
                  <StartAgentTabs
                    onTabClick={onTabClick}
                    { ...this.state }
                  />
                ),
            },
          ]
          : []),

        ...(!missingOSSelection.length &&
          this.state.selectedOS !== 'rpm' &&
          this.state.selectedOS !== 'deb' &&
          restartAgentCommand
          ? [
            {
              title: 'Start the agent',
              children: this.state.gotErrorRegistrationServiceInfo ?
                calloutErrorRegistrationServiceInfo
                : (
                  <EuiFlexGroup direction="column">
                    <EuiText>
                      <div className="copy-codeblock-wrapper">
                        <EuiCodeBlock language={language}>
                          {restartAgentCommand}
                        </EuiCodeBlock>
                        <EuiCopy textToCopy={restartAgentCommand}>
                          {(copy) => (
                            <div className="copy-overlay" onClick={copy}>
                              <p><EuiIcon type="copy" /> Copy command</p>
                            </div>
                          )}
                        </EuiCopy>
                      </div>
                    </EuiText>
                  </EuiFlexGroup>
                ),
            },
          ]
          : []),
      ];
      return (
        <div>
          <EuiPage restrictWidth="1000px" style={{ background: 'transparent' }}>
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
                            size="s"
                            onClick={() => this.props.addNewAgent(false)}
                            iconType="cross"
                          >
                            Close
                          </EuiButtonEmpty>
                        )}
                        {!this.props.hasAgents() && (
                          <EuiButtonEmpty
                            size="s"
                            onClick={() => this.props.reload()}
                            iconType="refresh"
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
                          <EuiProgress size="xs" color="primary" />
                        </EuiFlexItem>
                        <EuiSpacer></EuiSpacer>
                      </>
                    )}
                    {!this.state.loading && (
                      <EuiFlexItem>
                        <EuiSteps steps={steps} />
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
  }
);