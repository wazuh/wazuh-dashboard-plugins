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
import {
  EuiSteps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiButtonToggle,
  EuiButtonGroup,
  EuiFormRow,
  EuiComboBox,
  EuiFieldText,
  EuiText,
  EuiCodeBlock,
  EuiTitle,
  EuiButton,
  EuiButtonEmpty,
  EuiCopy,
  EuiPage,
  EuiPageBody,
  EuiCallOut,
  EuiSpacer,
  EuiProgress,
  EuiCode
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';


const architectureButtons = [
  {
    id: 'i386',
    label: 'i386'
  },
  {
    id: 'x86_64',
    label: 'x86_64'
  },
  {
    id: 'armhf',
    label: 'armhf'
  },
  {
    id: 'aarch64',
    label: 'aarch64'
  }
];
const architectureCentos5 = [
  {
    id: 'i386',
    label: 'i386'
  },
  {
    id: 'x86_64',
    label: 'x86_64'
  }
];

const versionButtonsCentos = [
  {
    id: 'centos5',
    label: 'CentOS5'
  },
  {
    id: 'centos6',
    label: 'CentOS6 or higher'
  }
];

const osButtons = [
  {
    id: 'rpm',
    label: 'Red Hat / CentOS'
  },
  {
    id: 'deb',
    label: 'Debian / Ubuntu'
  },
  {
    id: 'win',
    label: 'Windows'
  },
  {
    id: 'macos',
    label: 'MacOS'
  }
];

export class RegisterAgent extends Component {
  constructor(props) {
    super(props);
    this.wazuhConfig = new WazuhConfig();
    this.configuration = this.wazuhConfig.getConfig();
    this.state = {
      status: 'incomplete',
      selectedOS: '',
      selectedArchitecture: '',
      selectedVersion: '',
      version: '',
      serverAddress: '',
      wazuhPassword: '',
      groups: [],
      selectedGroup: [],
      udpProtocol: false
    };
    this.restartAgentCommand = {
      rpm: 'sudo systemctl start wazuh-agent',
      deb: 'sudo service wazuh-agent start',
      macos: 'sudo /Library/Ossec/bin/ossec-control start',
    }
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
      let authInfo = await this.getAuthInfo();
      const needsPassword = (authInfo.auth || {}).use_password === 'yes';
      if (needsPassword) {
        wazuhPassword = this.configuration["enrollment.password"] || authInfo['authd.pass'] || '';
        if (wazuhPassword) {
          hidePasswordInput = true;
        }
      }


      const udpProtocol = await this.getRemoteInfo();
      const groups = await this.getGroups();
      this.setState({
        serverAddress,
        needsPassword,
        hidePasswordInput,
        versionButtonsCentos,
        architectureButtons,
        architectureCentos5,
        wazuhPassword,
        udpProtocol,
        wazuhVersion,
        groups,
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
      const result = await WzRequest.apiReq(
        'GET',
        '/agents/000/config/auth/auth',
        {}
      );
      return (result.data || {}).data || {};
    } catch (error) {
      return false;
    }
  }

  async getRemoteInfo() {
    try {
      const result = await WzRequest.apiReq(
        'GET',
        '/agents/000/config/request/remote',
        {}
      );
      const remote = ((result.data || {}).data || {}).remote || {};
      return (remote[0] || {}).protocol !== 'tcp';
    } catch (error) {
      return false;
    }
  }

  selectOS(os) {
    this.setState({ selectedOS: os, selectedVersion: '', selectedArchitecture: '' });
  }

  setServerAddress(event) {
    this.setState({ serverAddress: event.target.value });
  }

  setGroupName(selectedGroup) {
    this.setState({ selectedGroup });
  }

  setArchitecture(selectedArchitecture) {
    this.setState({ selectedArchitecture });
  }

  setVersion(selectedVersion) {
    this.setState({ selectedVersion, selectedArchitecture: '' });
  }

  setWazuhPassword(event) {
    this.setState({ wazuhPassword: event.target.value });
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

  async getGroups() {
    try {
      const result = await WzRequest.apiReq(
        'GET',
        '/groups',
        {}
      );
      return result.data.data.affected_items.map(item =>
        ({ label: item.name, id: item.name })
      )
    } catch (error) {
      return [];
    }
  }

  optionalDeploymentVariables() {
    const deployment = `WAZUH_MANAGER='${this.state.serverAddress}' ${this.state.selectedOS == 'win' ? `WAZUH_REGISTRATION_SERVER='${this.state.serverAddress}' ` : ''}${this.state.needsPassword
      ? `WAZUH_REGISTRATION_PASSWORD='${this.state.wazuhPassword}' `
      : ''
      }${this.state.udpProtocol
        ? " WAZUH_PROTOCOL='UDP'"
        : ''
      }${this.state.selectedGroup.length ? `WAZUH_AGENT_GROUP='${this.state.selectedGroup.map(item => item.label).join(',')}' ` : ''}`
    return deployment;
  }

  resolveRPMPackage() {
    switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
      case 'centos5-i386':
        return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-1.el5.i386.rpm`
      case 'centos5-x86_64':
        return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}-1.el5.x86_64.rpm`
      case 'centos6-i386':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.i386.rpm`
      case 'centos6-aarch64':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.aarch64.rpm`
      case 'centos6-x86_64':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`
      case 'centos6-armhf':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.armv7h.rpm`
      default:
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`
    }
  }

  resolveDEBPackage() {
    switch (`${this.state.selectedArchitecture}`) {
      case 'i386':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}-1_i386.deb`
      case 'aarch64':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}-1_arm64.deb`
      case 'armhf':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}-1_armhf.deb`
      case 'x86_64':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}-1_amd64.deb`
      default:
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}-1_amd64.deb`
    }
  }

  optionalPackages() {
    switch (this.state.selectedOS) {
      case 'rpm':
        return this.resolveRPMPackage();
      case 'deb':
        return this.resolveDEBPackage();
      default:
        return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`;
    }
  }

  checkMissingOSSelection(){
    if(!this.state.selectedOS){
      return ['Operating system'];
    };
    switch (this.state.selectedOS) {
      case 'rpm':
        return [
          ...(!this.state.selectedVersion ? ['OS version'] : []),
          ...(this.state.selectedVersion && !this.state.selectedArchitecture ? ['OS architecture'] : [])
        ];
      case 'deb':
        return [
          ...(!this.state.selectedArchitecture ? ['OS architecture'] : [])
        ];
      default:
        return [];
    }
  };

  render() {
    const missingOSSelection = this.checkMissingOSSelection();
    const ipInput = (
      <EuiText>
        <p>
          You can predefine the Wazuh server address with the <EuiCode>enrollment.dns</EuiCode> Wazuh app setting.
        </p>
        <EuiFieldText
          placeholder="Server address"
          value={this.state.serverAddress}
          onChange={event => this.setServerAddress(event)}
        />
      </EuiText>
    );

    const groupInput = (
      <EuiText>
        <p>
          Select one or more existing groups
        </p>
        <EuiComboBox
          placeholder="Select group"
          options={this.state.groups}
          selectedOptions={this.state.selectedGroup}
          onChange={group => {
            this.setGroupName(group);
          }}
          isDisabled={!this.state.groups.length}
          isClearable={true}
          data-test-subj="demoComboBox"
        />
      </EuiText>
    );

    const passwordInput = (
      <EuiFieldText
        placeholder="Wazuh password"
        value={this.state.wazuhPassword}
        onChange={event => this.setWazuhPassword(event)}
      />
    );

    const codeBlock = {
      zIndex: '100'
    };
    const customTexts = {
      rpmText: `sudo ${this.optionalDeploymentVariables()}yum install ${this.optionalPackages()}`,
      debText: `curl -so wazuh-agent.deb ${this.optionalPackages()} && sudo ${this.optionalDeploymentVariables()}dpkg -i ./wazuh-agent.deb`,
      macosText: `curl -so wazuh-agent.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-${this.state.wazuhVersion
        }-1.pkg && sudo launchctl setenv ${this.optionalDeploymentVariables()}sudo installer -pkg ./wazuh-agent.pkg -target /`,
      winText: `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-${this.state.wazuhVersion
        }-1.msi -OutFile wazuh-agent.msi; ./wazuh-agent.msi /q ${this.optionalDeploymentVariables()}`
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
    const restartAgentCommand = this.restartAgentCommand[this.state.selectedOS];

    const guide = (
      <div>
        {this.state.selectedOS && (
          <EuiText>
            <p>You can use this command to install and enroll the Wazuh agent in one or more hosts.</p>
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
        title: 'Choose the Operating system',
        children: <EuiButtonGroup
          color='primary'
          options={osButtons}
          idSelected={this.state.selectedOS}
          onChange={os => this.selectOS(os)}
        />
      },
      ...((this.state.selectedOS == 'rpm') ? [{
        title: 'Choose the version',
        children: <EuiButtonGroup
          color='primary'
          options={versionButtonsCentos}
          idSelected={this.state.selectedVersion}
          onChange={version => this.setVersion(version)}
        />
      }] : []),
      ...((this.state.selectedOS == 'rpm' && this.state.selectedVersion == 'centos5') ? [{
        title: 'Choose the architecture',
        children: <EuiButtonGroup
          color='primary'
          options={this.state.architectureCentos5}
          idSelected={this.state.selectedArchitecture}
          onChange={architecture => this.setArchitecture(architecture)}
        />
      }] : []),
      ...((this.state.selectedOS == 'deb' || (this.state.selectedOS == 'rpm' && this.state.selectedVersion == 'centos6')) ? [{
        title: 'Choose the architecture',
        children: <EuiButtonGroup
          color='primary'
          options={this.state.architectureButtons}
          idSelected={this.state.selectedArchitecture}
          onChange={architecture => this.setArchitecture(architecture)}
        />
      }] : []),
      {
        title: 'Wazuh server address',
        children: <Fragment>{ipInput}</Fragment>
      },
      ...(!(!this.state.needsPassword || this.state.hidePasswordInput) ? [{
        title: 'Wazuh password',
        children: <Fragment>{passwordInput}</Fragment>
      }] : []),
      {
        title: 'Assign the agent to a group',
        children: <Fragment>{groupInput}</Fragment>
      },
      {
        title: 'Install and enroll the agent',
        children: missingOSSelection.length
          ? <EuiCallOut
              color="warning"
              title={`Please select the ${missingOSSelection.join(', ')}.`}
              iconType="iInCircle"
            />  
          : <div>{guide}</div>
      },
      ...(!missingOSSelection.length && restartAgentCommand ? [
        {
          title: 'Start the agent',
          children: (
            <EuiText>
              <EuiCodeBlock style={codeBlock} language={language}>
                {restartAgentCommand}
              </EuiCodeBlock>
              <EuiCopy textToCopy={restartAgentCommand}>
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
          )
        }
      ] : [])
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
