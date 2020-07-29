/*
 * Wazuh app - React component for registering agents.
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
import { version } from '../../../../package.json';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import { ApiRequest } from '../../../react-services/api-request';
import {
  EuiSteps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiButtonToggle,
  EuiFieldText,
  EuiText,
  EuiCodeBlock,
  EuiTitle,
  EuiButton,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiCopy,
  EuiPage,
  EuiPageBody,
  EuiCallOut,
  EuiSpacer,
  EuiProgress
} from '@elastic/eui';

export class RegisterAgent extends Component {
  constructor(props) {
    super(props);
    this.apiReq = ApiRequest;
    this.wazuhConfig = new WazuhConfig();
    this.configuration = this.wazuhConfig.getConfig();
    this.state = {
      status: 'incomplete',
      selectedOS: '',
      serverAddress: '',
      wazuhPassword: '',
      tcpProtocol: false
    };
  }

  async componentDidMount() {
    try {
      this.setState({ loading: true });
      const wazuhVersion = await this.props.getWazuhVersion();
      let serverAddress = false;
      let wazuhPassword = '';
      let hidePasswordInput = false;
      serverAddress = this.configuration["enrollment.dns"] || false;
      if (!serverAddress) {
        serverAddress = await this.props.getCurrentApiAddress();
      }
      let needsPassword = await this.getAuthInfo();
      if (needsPassword) {
        wazuhPassword = this.configuration["enrollment.password"] || '';
        if (wazuhPassword) {
          hidePasswordInput = true;
        }
      }
      const tcpProtocol = await this.getRemoteInfo();
      this.setState({
        serverAddress,
        needsPassword,
        hidePasswordInput,
        wazuhPassword,
        tcpProtocol,
        wazuhVersion,
        loading: false
      });
    } catch (error) {
      this.setState({
        wazuhVersion: version,
        loading: false
      });
    }
  }

  async getAuthInfo() {
    try {
      const result = await this.apiReq.request(
        'GET',
        '/agents/000/config/auth/auth',
        {}
      );
      const auth = ((result.data || {}).data || {}).auth || {};
      const usePassword = auth.use_password === 'yes';
      return usePassword;
    } catch (error) {
      return false;
    }
  }

  async getRemoteInfo() {
    try {
      const result = await this.apiReq.request(
        'GET',
        '/agents/000/config/request/remote',
        {}
      );
      const remote = ((result.data || {}).data || {}).remote || {};
      return (remote[0] || {}).protocol === 'tcp';
    } catch (error) {
      return false;
    }
  }

  selectOS(os) {
    this.setState({ selectedOS: os });
  }

  setServerAddress(event) {
    this.setState({ serverAddress: event.target.value });
  }

  setWazuhPassword(event) {
    this.setState({ wazuhPassword: event.target.value });
  }

  /**
   * Checks if the password is not needed, in that case remove the input password step
   * @param {Array} steps
   */
  cleanSteps(steps) {
    if (!this.state.needsPassword || this.state.hidePasswordInput)
      steps.splice(2, 1);
    return steps;
  }

  obfuscatePassword(text) {
    let obfuscate = '';
    const regex = /WAZUH_REGISTRATION_PASSWORD=?\040?\'(.*?)\'/gm;
    const match = regex.exec(text);
    const password = match[1];
    if (password) {
      [...password].forEach(() => obfuscate += '*')
      text = text.replace(password, obfuscate);
    }
    return text;
  }

  render() {
    const rpmButton = (
      <EuiButtonToggle
        label="Red Hat / CentOS"
        onChange={() => this.selectOS('rpm')}
        fill={this.state.selectedOS === 'rpm'}
      />
    );

    const debButton = (
      <EuiButtonToggle
        label="Debian / Ubuntu"
        onChange={() => this.selectOS('deb')}
        fill={this.state.selectedOS === 'deb'}
      />
    );

    const windowsButton = (
      <EuiButtonToggle
        label="Windows"
        onChange={() => this.selectOS('win')}
        fill={this.state.selectedOS === 'win'}
      />
    );

    const macOSButton = (
      <EuiButtonToggle
        label="MacOS"
        onChange={() => this.selectOS('macos')}
        fill={this.state.selectedOS === 'macos'}
      />
    );

    const ipInput = (
      <EuiFieldText
        placeholder="Server address..."
        value={this.state.serverAddress}
        onChange={event => this.setServerAddress(event)}
      />
    );

    const passwordInput = (
      <EuiFieldText
        placeholder="Wazuh password..."
        value={this.state.wazuhPassword}
        onChange={event => this.setWazuhPassword(event)}
      />
    );

    const codeBlock = {
      zIndex: '100'
    };
    const customTexts = {
      rpmText: `sudo WAZUH_MANAGER='${this.state.serverAddress}'${
        this.state.needsPassword
          ? ` WAZUH_REGISTRATION_PASSWORD='${this.state.wazuhPassword}'`
          : ''
        }${
        this.state.tcpProtocol
          ? " WAZUH_PROTOCOL='TCP'"
          : ''
        } yum install https://packages.wazuh.com/3.x/yum/wazuh-agent-${
        this.state.wazuhVersion
        }-1.x86_64.rpm`,
      debText: `curl -so wazuh-agent.deb https://packages.wazuh.com/3.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${
        this.state.wazuhVersion
        }-1_amd64.deb && sudo WAZUH_MANAGER='${this.state.serverAddress}'${
        this.state.needsPassword
          ? ` WAZUH_REGISTRATION_PASSWORD='${this.state.wazuhPassword}'`
          : ''
        }${
        this.state.tcpProtocol
          ? " WAZUH_PROTOCOL='TCP'"
          : ''
        } dpkg -i ./wazuh-agent.deb`,
      macosText: `curl -so wazuh-agent.pkg https://packages.wazuh.com/3.x/osx/wazuh-agent-${
        this.state.wazuhVersion
        }-1.pkg && sudo launchctl setenv WAZUH_MANAGER '${
        this.state.serverAddress
        }'${
        this.state.needsPassword
          ? ` WAZUH_REGISTRATION_PASSWORD '${this.state.wazuhPassword}'`
          : ''
        }${
        this.state.tcpProtocol
          ? " WAZUH_PROTOCOL 'TCP'"
          : ''
        } && sudo installer -pkg ./wazuh-agent.pkg -target /`,
      winText: `Invoke-WebRequest -Uri https://packages.wazuh.com/3.x/windows/wazuh-agent-${
        this.state.wazuhVersion
        }-1.msi -OutFile wazuh-agent.msi; ./wazuh-agent.msi /q WAZUH_MANAGER='${
        this.state.serverAddress
        }' WAZUH_REGISTRATION_SERVER='${this.state.serverAddress}'${
        this.state.needsPassword
          ? ` WAZUH_REGISTRATION_PASSWORD='${this.state.wazuhPassword}'`
          : ''
        }${
        this.state.tcpProtocol
          ? " WAZUH_PROTOCOL='TCP'"
          : ''
        }`
    };

    const field = `${this.state.selectedOS}Text`;
    const text = customTexts[field];
    const language = this.state.selectedOS === 'win' ? 'ps' : 'bash';
    const windowsAdvice = this.state.selectedOS === 'win' && (
      <>
        <EuiCallOut
          title="You will need administrator privileges to perform this installation."
          iconType="iInCircle"
        />
        <EuiSpacer></EuiSpacer>
      </>
    );

    const guide = (
      <div>
        {this.state.selectedOS && (
          <EuiText>
            <p>You can use this command to install and enroll the Wazuh agent in one or more host.</p>
            <EuiCodeBlock style={codeBlock} language={language}>
              {this.state.wazuhPassword ? this.obfuscatePassword(text) : text}
            </EuiCodeBlock>
            {windowsAdvice}
            <EuiCopy textToCopy={text}>
              {copy => (
                <EuiButton
                  fill
                  iconType="copy"
                  onClick={copy}>
                  Copy command
                </EuiButton>
              )}
            </EuiCopy>
          </EuiText>
        )}
      </div>
    );

    const steps = [
      {
        title: 'Choose OS',
        children: (
          <Fragment>
            {rpmButton} {debButton} {windowsButton} {macOSButton}
          </Fragment>
        )
      },
      {
        title: 'Wazuh server address',
        children: <Fragment>{ipInput}</Fragment>
      },
      {
        title: 'Wazuh password',
        children: <Fragment>{passwordInput}</Fragment>
      },
      {
        title: 'Install and enroll the agent',
        children: (
          <div>
            <Fragment>
              <div>{guide}</div>
            </Fragment>
          </div>
        )
      }
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
                      {this.props.hasAgents && (
                        <EuiButtonEmpty
                          size="s"
                          onClick={() => this.props.addNewAgent(false)}
                          iconType="cross"
                        >
                          Close
                        </EuiButtonEmpty>
                      )}
                      {!this.props.hasAgents && (
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
                      <EuiSteps steps={this.cleanSteps(steps)} />
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