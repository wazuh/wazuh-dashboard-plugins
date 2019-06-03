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

import { RegisterGuideDefs } from './register-guide-defs';
export class RegisterAgent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: 'incomplete',
      selectedOS: '',
      serverAddress: '',
      osSteps: {
        rpm: 2,
        deb: 4,
        win: 1,
        macos: 1
      }
    };
  }

  selectOS(os) {
    this.setState({ selectedOS: os })
  }

  setServerAddress = e => {
    this.setState({ serverAddress: e.target.value })
  }

  render() {
    const rpmButton = (
      <EuiButtonToggle
        label='Red Hat / CentOS'
        onChange={(e) => this.selectOS('rpm')}
        fill={this.state.selectedOS === 'rpm'}
      />
    );

    const debButton = (
      <EuiButtonToggle
        label='Debian / Ubuntu'
        onChange={(e) => this.selectOS('deb')}
        fill={this.state.selectedOS === 'deb'}
      />
    );

    const windowsButton = (
      <EuiButtonToggle
        label='Windows'
        onChange={(e) => this.selectOS('win')}
        fill={this.state.selectedOS === 'win'}
      />
    );

    const macOSButton = (
      <EuiButtonToggle
        label='MacOS'
        onChange={(e) => this.selectOS('macos')}
        fill={this.state.selectedOS === 'macos'}
      />
    );

    const ipInput = (
      <EuiFieldText
        placeholder='Server address...'
        value={this.state.serverAddress}
        onChange={this.setServerAddress}
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
      zIndex: '100',
    };

    const customTexts = {
      rpmText2: `WAZUH_MANAGER_IP='${this.state.serverAddress}' yum install wazuh-agent`,
      debText4: `WAZUH_MANAGER_IP='${this.state.serverAddress}' apt-get install wazuh-agent`,
      macosText1: `launchctl setenv WAZUH_MANAGER_IP '${this.state.serverAddress}' && installer -pkg wazuh-agent-.pkg -target /`,
      winText1: `wazuh-agent-3.9.1-1.msi /q ADDRESS='${this.state.serverAddress}' AUTHD_SERVER='${this.state.serverAddress}'`
    }

    let guide = [];
    for (let i = 0; i < this.state.osSteps[this.state.selectedOS]; i++) {
      const title = `${this.state.selectedOS}Title${i + 1}`;
      const text = `${this.state.selectedOS}Text${i + 1}`;
      guide.push(
        <div key={i}>
          < EuiText >
            <p>{RegisterGuideDefs[title]}</p>
            <div style={copyButton}>
              <EuiCopy textToCopy={RegisterGuideDefs[text] || customTexts[text]} >
                {copy => (
                  <EuiButtonIcon
                    onClick={copy}
                    iconType='copy'
                    aria-label='Copy'
                  />
                )}
              </EuiCopy>
            </div>
            <EuiCodeBlock style={codeBlock} language='js'>
              {RegisterGuideDefs[text] || customTexts[text]}
            </EuiCodeBlock>
          </EuiText>
        </div>
      );
    }

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
        children: (
          <Fragment>
            {ipInput}
          </Fragment>
        )
      },
      {
        title: 'Complete the installation',
        children: (
          <div>
            <Fragment>
              <div>
                {guide}
              </div>
            </Fragment>
          </div>
        )
      },
    ];

    return (
      <div>
        <EuiPage restrictWidth='800px'>
          <EuiPageBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Add a new agent</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size='s' onClick={() => this.props.addNewAgent(false)} iconType='cross'>
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





