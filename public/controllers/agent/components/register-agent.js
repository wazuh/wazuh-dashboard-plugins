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
  EuiPageBody
} from '@elastic/eui';

import PropTypes from 'prop-types';

export class RegisterAgent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: 'incomplete',
      selectedOS: '',
      serverAddress: ''
    };    
  }

  async componentDidMount() {
    try {
      this.wazuhVersion = await this.props.getWazuhVersion();
    } catch (error) {
      this.wazuhVersion = version;
    }
  }

  selectOS(os) {
    this.setState({ selectedOS: os });
  }

  setServerAddress(event) {
    this.setState({ serverAddress: event.target.value });
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
      rpmText: `WAZUH_MANAGER_IP='${this.state.serverAddress}' yum install https://packages.wazuh.com/3.x/yum/wazuh-agent-${this.wazuhVersion}-1.x86_64.rpm`,
      debText: `curl -so wazuh-agent.deb https://packages.wazuh.com/3.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.wazuhVersion}-1_amd64.deb && WAZUH_MANAGER_IP='${this.state.serverAddress}' && dpkg -i ./wazuh-agent.deb`,
      macosText: `curl -so wazuh-agent.pkg https://packages.wazuh.com/3.x/osx/wazuh-agent-${this.wazuhVersion}-1.pkg && launchctl setenv WAZUH_MANAGER_IP '${this.state.serverAddress}' && installer -pkg ./wazuh-agent.pkg -target /`,
      winText: `Invoke-WebRequest -Uri https://packages.wazuh.com/3.x/windows/wazuh-agent-${this.wazuhVersion}-1.msi -OutFile wazuh-agent.msi; wazuh-agent.msi /q ADDRESS='${this.state.serverAddress}' AUTHD_SERVER='${this.state.serverAddress}'`
    };

    const field = `${this.state.selectedOS}Text`;
    const text = customTexts[field];

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
            <EuiCodeBlock style={codeBlock} language="bash">
              {text}
            </EuiCodeBlock>
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
        <EuiPage restrictWidth="1000px">
          <EuiPageBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Add a new agent</h2>
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
                    <EuiSteps steps={steps} />
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
  getWazuhVersion: PropTypes.func
};
