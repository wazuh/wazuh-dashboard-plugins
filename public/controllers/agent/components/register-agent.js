/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiCopy,
  EuiPage,
  EuiPageBody,
  EuiCallOut
} from '@elastic/eui';

import PropTypes from 'prop-types';

export class RegisterAgent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: 'incomplete',
      selectedOS: '',
      serverAddress: '',
      wazuhPassword: ''
    };
  }

  async componentDidMount() {
    try {
      const wazuhVersion = await this.props.getWazuhVersion();
      const apiAddress = await this.props.getCurrentApiAddress();
      const needsPassword = await this.props.needsPassword();
      this.setState({
        serverAddress: apiAddress,
        needsPassword: needsPassword,
        wazuhVersion: wazuhVersion
      })
    } catch (error) {
      this.setState({
        wazuhVersion: version
      })
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
    if (this.state.needsPassword) return steps;
    steps.splice(2,1);
    return steps;
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

    const copyButton = {
      position: 'relative',
      float: 'right',
      zIndex: '1000',
      right: '8px',
      top: '16px'
    };

    const codeBlock = {
      zIndex: '100'
    };
    const customTexts = {
      rpmText: `sudo WAZUH_MANAGER_IP='${this.state.serverAddress}'${this.state.needsPassword ? ` WAZUH_PASSWORD='${this.state.wazuhPassword}' ` : ' '}yum install https://packages.wazuh.com/3.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`,
      debText: `curl -so wazuh-agent.deb https://packages.wazuh.com/3.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}-1_amd64.deb && sudo WAZUH_MANAGER_IP='${this.state.serverAddress}'${this.state.needsPassword ? ` WAZUH_PASSWORD='${this.state.wazuhPassword}' ` : ' '} dpkg -i ./wazuh-agent.deb`,
      macosText: `curl -so wazuh-agent.pkg https://packages.wazuh.com/3.x/osx/wazuh-agent-${this.state.wazuhVersion}-1.pkg && sudo launchctl setenv WAZUH_MANAGER_IP '${this.state.serverAddress}'${this.state.needsPassword ? ` setenv WAZUH_PASSWORD '${this.state.wazuhPassword}' ` : ' '} && sudo installer -pkg ./wazuh-agent.pkg -target /`,
      winText: `Invoke-WebRequest -Uri https://packages.wazuh.com/3.x/windows/wazuh-agent-${this.state.wazuhVersion}-1.msi -OutFile wazuh-agent.msi; wazuh-agent.msi /q ADDRESS='${this.state.serverAddress}' AUTHD_SERVER='${this.state.serverAddress}'${this.state.needsPassword ? ` PASSWORD='${this.state.wazuhPassword}' ` : ' '}`
    };

    const field = `${this.state.selectedOS}Text`;
    const text = customTexts[field];
    const language = this.state.selectedOS === 'win' ? 'ps' : 'bash';
    const windowsAdvice = this.state.selectedOS === 'win' && (
      <EuiCallOut
        size="s"
        title="You will need administrator privileges to perform this installation."
        iconType="iInCircle"
      />
    );

    const guide = (
      <div>
        {this.state.selectedOS && (
          <EuiText>
            <div style={copyButton}>
              <EuiCopy textToCopy={text}>
                {copy => (
                  <EuiButtonIcon
                    onClick={copy}
                    iconType="copy"
                    aria-label="Copy"
                  />
                )}
              </EuiCopy>
            </div>
            <EuiCodeBlock style={codeBlock} language={language}>
              {text}
            </EuiCodeBlock>
            {windowsAdvice}
          </EuiText>
        )}
      </div>
    );

    const steps = [
      {
        title: 'Choose your OS',
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
        title: 'Complete the installation',
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
        <EuiPage restrictWidth="1000px" style={{background: "transparent"}} >
          <EuiPageBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Deploy a new agent</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="s"
                  onClick={() => this.props.addNewAgent(false)}
                  iconType="cross"
                >
                  close
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPanel>
                  <EuiFlexItem>
                    <EuiSteps steps={this.cleanSteps(steps)} />
                  </EuiFlexItem>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageBody>
        </EuiPage>
      </div>
    );
  }
}

RegisterAgent.propTypes = {
  addNewAgent: PropTypes.func,
  getWazuhVersion: PropTypes.func,
  getCurrentApiAddress: PropTypes.func,
  needsPassword: PropTypes.func
};
