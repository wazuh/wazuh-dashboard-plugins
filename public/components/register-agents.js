import React, { Component, Fragment } from 'react';

import { EuiSteps, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiButtonToggle, EuiFieldText, EuiText, EuiCodeBlock, EuiTitle, EuiButtonIcon, EuiButtonEmpty } from '@elastic/eui';

export class WazuhRegisterAgents extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: 'incomplete',
      selectedOS: '',
      serverAddress: '',
    };
  }

  selectOS(os) {
    this.setState({ selectedOS: os })
  }

  setServerAddress = e => {
    this.setState({ serverAddress: e.target.value })
  }

  copyCode(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
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
        placeholder="Server address..."
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

    const rpmText = `rpm --import http://packages.wazuh.com/key/GPG-KEY-WAZUH\ncat > /etc/yum.repos.d/wazuh.repo <<\EOF\n[wazuh_repo]\ngpgcheck=1\ngpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH\nenabled=1\nname=Wazuh repository\nbaseurl=https://packages.wazuh.com/3.x/yum/\nprotect=1\nEOF`;
    const rpmText2 = `WAZUH_MANAGER_IP="${this.state.serverAddress}" yum install wazuh-agent`;
    const debText = `apt-get install curl apt-transport-https lsb-release`;
    const debText2 = `curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add -`;
    const debText3 = `echo "deb https://packages.wazuh.com/3.x/apt/ stable main" | tee /etc/apt/sources.list.d/wazuh.list\napt-get update`;
    const debText4 = `WAZUH_MANAGER_IP="${this.state.serverAddress}" apt-get install wazuh-agent`;
    const macosText = `launchctl setenv WAZUH_MANAGER_IP "${this.state.serverAddress}" && installer -pkg wazuh-agent-.pkg -target /`;
    const winText = `wazuh-agent-3.9.1-1.msi /q ADDRESS="${this.state.serverAddress}" AUTHD_SERVER="${this.state.serverAddress}"`;

    const guide = (
      <div>
        {this.state.selectedOS === 'rpm' ? (
          <EuiText>
            <p>Add the Wazuh repository</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(rpmText)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {rpmText}
            </EuiCodeBlock>
            <p>Deploy the installation</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(rpmText2)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {rpmText2}
            </EuiCodeBlock>
          </EuiText>
        ) : (<EuiFlexItem />)}
        {this.state.selectedOS === 'deb' ? (
          <EuiText>
            <p>Install the necessaries utilities</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(debText)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {debText}
            </EuiCodeBlock>
            <p>Install the Wazuh repository GPG key</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(debText2)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {debText2}
            </EuiCodeBlock>
            <p>Add the repository</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(debText3)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {debText3}
            </EuiCodeBlock>
            <p>Deploy the installation</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(debText4)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {debText4}
            </EuiCodeBlock>
          </EuiText>
        ) : (<EuiFlexItem />)}
        {this.state.selectedOS === 'win' ? (
          <EuiText>
            <p>Deploy the installation</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(win)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {winText}
            </EuiCodeBlock>
          </EuiText>
        ) : (<EuiFlexItem />)}
        {this.state.selectedOS === 'macos' ? (
          <EuiText>
            <p>Deploy the installation</p>
            <EuiButtonIcon
              style={copyButton}
              onClick={(e) => this.copyCode(macos)}
              iconType="copy"
              aria-label="Copy"
            />
            <EuiCodeBlock style={codeBlock} language="js">
              {macosText}
            </EuiCodeBlock>
          </EuiText>
        ) : (<EuiFlexItem />)}
      </div>);

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

    const containerStyle = {
      width: '800px',
      margin: '50px auto'
    };

    return (
      <div style={containerStyle}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h2>Add a new agent</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" onClick={() => this.props.addNewAgent(false)} iconType="cross">
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
      </div>
    );
  }
}





