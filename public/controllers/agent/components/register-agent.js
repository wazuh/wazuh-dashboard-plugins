import React, { Component, Fragment } from 'react';

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

  selectOS(os) {
    this.setState({ selectedOS: os });
  }

  setServerAddress(event) {
    this.setState({ serverAddress: event.target.value });
  }

  clearSteps(steps) {
    if (['win', 'macos'].includes(this.state.selectedOS)) {
      steps.splice(2, 1);
    }
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
      rpmText: `WAZUH_MANAGER_IP='${this.state.serverAddress}' yum install wazuh-agent`,
      debText: `WAZUH_MANAGER_IP='${this.state.serverAddress}' apt-get install wazuh-agent`,
      macosText: `launchctl setenv WAZUH_MANAGER_IP '${this.state.serverAddress}' && installer -pkg wazuh-agent-.pkg -target /`,
      winText: `wazuh-agent-3.9.1-1.msi /q ADDRESS='${this.state.serverAddress}' AUTHD_SERVER='${this.state.serverAddress}'`
    };

    const repositoriesText = {
      rpmRepo:
        `rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH &&
cat > /etc/yum.repos.d/wazuh.repo <<\EOF
[wazuh_repo]
gpgcheck=1
gpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH
enabled=1
name=Wazuh repository
baseurl=https://packages.wazuh.com/3.x/yum/
protect=1
EOF`,
      debRepo:
        `curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add - && 
echo "deb https://packages.wazuh.com/3.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list && 
apt-get update`
    }

    const field = `${this.state.selectedOS}`;
    const text = customTexts[`${field}Text`];
    const repo = repositoriesText[`${field}Repo`];

    const repository = (
      <div>
        {this.state.selectedOS && (
          <EuiText>
            <div style={copyButton}>
              <EuiCopy textToCopy={repo}>
                {copy => (
                  <EuiButtonIcon
                    onClick={copy}
                    iconType="copy"
                    aria-label="Copy"
                  />
                )}
              </EuiCopy>
            </div>
            <EuiCodeBlock style={codeBlock} language="js">
              {repo}
            </EuiCodeBlock>
          </EuiText>
        )}
      </div>
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
            <EuiCodeBlock style={codeBlock} language="js">
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
        title: 'Add the repository',
        children: (
          <div>
            <Fragment>
              <div>{repository}</div>
            </Fragment>
          </div>
        )
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
                    <EuiSteps steps={this.clearSteps(steps)} />
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
  addNewAgent: PropTypes.func
};
