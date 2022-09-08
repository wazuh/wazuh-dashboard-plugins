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
  EuiTabbedContent,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiButtonGroup,
  EuiComboBox,
  EuiFieldText,
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
  EuiIcon,
  EuiSwitch
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { architectureButtons, architectureButtonsi386, architectureCentos5OrRedHat5, architectureButtonsSolaris, architectureButtonsOpenSuse, architectureButtonsAix, architectureButtonsHpUx, versionButtonsRedHat, versionButtonsCentos, osButtons, versionButtonsDebian, versionButtonsUbuntu, versionButtonsWindows, versionButtonsMacOS, versionButtonsOpenSuse, versionButtonsSolaris, versionButtonsAix, versionButtonsHPUX } from '../wazuh-config'

export const RegisterAgent = withErrorBoundary(

  class RegisterAgent extends Component {
    constructor(props) {
      super(props);
      this.wazuhConfig = new WazuhConfig();
      this.configuration = this.wazuhConfig.getConfig();
      this.state = {
        status: 'incomplete',
        selectedOS: '',
        selectedSYS: '',
        neededSYS: false,
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
      };
      this.restartAgentCommand = {
        rpm: this.systemSelector(),
        cent: this.systemSelector(),
        deb: this.systemSelector(),
        ubu: this.systemSelector(),
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
        let authInfo = await this.getAuthInfo();
        const needsPassword = (authInfo.auth || {}).use_password === 'yes';
        if (needsPassword) {
          wazuhPassword = this.configuration['enrollment.password'] || authInfo['authd.pass'] || '';
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
          versionButtonsRedHat,
          versionButtonsCentos,
          versionButtonsDebian,
          versionButtonsUbuntu,
          versionButtonsWindows,
          versionButtonsMacOS,
          versionButtonsOpenSuse,
          versionButtonsSolaris,
          versionButtonsAix,
          versionButtonsHPUX,
          architectureButtons,
          architectureButtonsi386,
          architectureCentos5OrRedHat5,
          architectureButtonsSolaris,
          architectureButtonsAix,
          architectureButtonsHpUx,
          wazuhPassword,
          udpProtocol,
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

    async getAuthInfo() {
      try {
        const result = await WzRequest.apiReq('GET', '/agents/000/config/auth/auth', {});
        return (result.data || {}).data || {};
      } catch (error) {
        this.setState({ gotErrorRegistrationServiceInfo: true });
        throw new Error(error);
      }
    }

    async getRemoteInfo() {
      try {
        const result = await WzRequest.apiReq('GET', '/agents/000/config/request/remote', {});
        const remote = ((result.data || {}).data || {}).remote || {};
        return (remote[0] || {}).protocol !== 'tcp' && (remote[0] || {}).protocol[0] !== 'TCP';
      } catch (error) {
        throw new Error(error);
      }
    }

    selectOS(os) {
      this.setState({
        selectedOS: os,
        selectedVersion: '',
        selectedArchitecture: '',
        selectedSYS: '',
      });
    }

    systemSelector() {
      if (this.state.selectedVersion === 'redhat7' || this.state.selectedVersion === 'centos7' || this.state.selectedVersion === 'debian8' || this.state.selectedVersion === 'debian10' || this.state.selectedVersion === 'ubuntu15' || this.state.selectedVersion === 'ubuntu16' || this.state.selectedVersion === 'leap15') {
        return 'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';
      } else if (this.state.selectedVersion === 'redhat5' || this.state.selectedVersion === 'redhat6' || this.state.selectedVersion === 'centos5' || this.state.selectedVersion === 'centos6' || this.state.selectedVersion === 'debian7' || this.state.selectedVersion === 'ubuntu14') {
        return ('service wazuh-agent start')
      }
    }

    systemSelectorUpstart() {
      if (this.state.selectedVersion === 'ubuntu14') {
        return ('update-rc.d wazuh-agent defaults && service wazuh-agent start')
      }
    }

    systemSelectorNet() {
      if (this.state.selectedVersion === 'windowsxp' || this.state.selectedVersion === 'windows8') {
        return ('update-rc.d wazuh-agent defaults && service wazuh-agent start')
      }
    }

    systemSelectorWazuhControlMacos() {
      if (this.state.selectedVersion === 'sierra') {
        return ('/Library/Ossec/bin/wazuh-control start')
      }
    }

    systemSelectorWazuhControl() {
      if (this.state.selectedVersion === 'solaris10' || this.state.selectedVersion === 'solaris11' || this.state.selectedVersion === '6.1 TL9' || this.state.selectedVersion === '11.31') {
        return ('/var/ossec/bin/wazuh-control start')
      }
    }

    selectSYS(sys) {
      this.setState({ selectedSYS: sys });
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

    setShowPassword(event) {
      this.setState({ showPassword: event.target.checked });
    }

    obfuscatePassword(text) {
      let obfuscate = '';
      const regex = /WAZUH_REGISTRATION_PASSWORD=?\040?\'(.*?)\'/gm;
      const match = regex.exec(text);
      const password = match[1];
      if (password) {
        [...password].forEach(() => (obfuscate += '*'));
        text = text.replace(password, obfuscate);
      }
      return text;
    }

    async getGroups() {
      try {
        const result = await WzRequest.apiReq('GET', '/groups', {});
        return result.data.data.affected_items.map((item) => ({ label: item.name, id: item.name }));
      } catch (error) {
        throw new Error(error);
      }
    }

    optionalDeploymentVariables() {
      let deployment = `WAZUH_MANAGER='${this.state.serverAddress}' `;

      if (this.state.selectedOS == 'win') {
        deployment += `WAZUH_REGISTRATION_SERVER='${this.state.serverAddress}' `;
      }

      if (this.state.needsPassword) {
        deployment += `WAZUH_REGISTRATION_PASSWORD='${this.state.wazuhPassword}' `;
      }

      if (this.state.udpProtocol) {
        deployment += `WAZUH_PROTOCOL='UDP' `;
      }

      if (this.state.selectedGroup.length) {
        deployment += `WAZUH_AGENT_GROUP='${this.state.selectedGroup
          .map((item) => item.label)
          .join(',')}' `;
      }

      // macos doesnt need = param
      if (this.state.selectedOS === 'macos') {
        return deployment.replace(/=/g, ' ');
      }

      return deployment;
    }

    resolveRPMPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case 'redhat5-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-1.el5.i386.rpm`;
        case 'redhat5-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}-1.el5.x86_64.rpm`;
        case 'redhat6-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.i386.rpm`;
        case 'redhat6-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.aarch64.rpm`;
        case 'redhat6-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`;
        case 'redhat6-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.armv7hl.rpm`;
        case 'redhat7-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.i386.rpm`;
        case 'redhat7-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.aarch64.rpm`;
        case 'redhat7-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`;
        case 'redhat7-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.armv7hl.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`;
      }
    }

    resolveCENTPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case 'centos5-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}.el5.i386.rpm`;
        case 'centos5-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}.el5.x86_64.rpm`;
        case 'centos6-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.i386.rpm`;
        case 'centos6-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.aarch64.rpm`;
        case 'centos6-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.x86_64.rpm`;
        case 'centos6-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.armv7hl.rpm`;
        case 'centos7-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.i386.rpm`;
        case 'centos7-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.aarch64.rpm`;
        case 'centos7-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.x86_64.rpm`;
        case 'centos7-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.armv7hl.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.x86_64.rpm`;
      }
    }

    resolveDEBPackage() {
      switch (`${this.state.selectedArchitecture}`) {
        case 'i386':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_i386.deb`;
        case 'aarch64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_amd64.deb`;
        case 'armhf':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_armhf.deb`;
        case 'x86_64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_arm64.deb`;
        default:
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_amd64.deb`;
      }
    }

    resolveUBUNTUPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case 'i386':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_i386.deb`;
        case 'aarch64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_amd64.deb`;
        case 'armhf':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_armhf.deb`;
        case 'x86_64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_arm64.deb`;
        default:
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}_amd64.deb`;
      }
    }

    resolveOPENSUSEPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case 'leap15-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}.x86_64.rpm`;
        case 'leap15-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}.armv7hl.rpm`
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}.x86_64.rpm`;
      }
    }

    resolveSOLARISPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case 'solaris10-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-sol10-i386.pkg`;
        case 'solaris10-spark':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-sol10-sparc.pkg`;
        case 'solaris11-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-sol11-i386.p5p`;
        case 'solaris11-spark':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}-sol11-sparc.p5p`
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}-sol11-sparc.p5p`;
      }
    }

    resolveAIXPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case '6.1 TL9-powerpc':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}.aix.ppc.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}.aix.ppc.rpm`;
      }
    }

    resolveHPPackage() {
      switch (`${this.state.selectedVersion}-${this.state.selectedArchitecture}`) {
        case '11.31-itanium2':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-hpux-11v3-ia64.tar`;
        default:
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}-hpux-11v3-ia64.tar`;
      }
    }

    optionalPackages() {
      switch (this.state.selectedOS) {
        case 'rpm':
          return this.resolveRPMPackage();
        case 'cent':
          return this.resolveCENTPackage();
        case 'deb':
          return this.resolveDEBPackage();
        case 'ubu':
          return this.resolveUBUNTUPackage();
        case 'open':
          return this.resolveOPENSUSEPackage();
        case 'sol':
          return this.resolveSOLARISPackage();
        case 'aix':
          return this.resolveAIXPackage();
        case 'hp':
          return this.resolveHPPackage();
        default:
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}-1.x86_64.rpm`;
      }
    }

    checkMissingOSSelection() {
      if (!this.state.selectedOS) {
        return ['Operating system'];
      }
      switch (this.state.selectedOS) {
        case 'rpm':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'cent':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'deb':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'ubu':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'win':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'macos':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'open':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'sol':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'aix':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'hp':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        default:
          return [];
      }
    }

    getHighlightCodeLanguage(selectedSO) {
      if (selectedSO.toLowerCase() === 'win') {
        return 'powershell';
      } else {
        return 'bash';
      }
    }

    render() {
      const appVersionMajorDotMinor = this.state.wazuhVersion.split('.').slice(0, 2).join('.');
      const urlCheckConnectionDocumentation = webDocumentationLink('user-manual/agents/agent-connection.html', appVersionMajorDotMinor);
      const textAndLinkToCheckConnectionDocumentation = (
        <p>
          To verify the connection with the Wazuh server, please follow this{' '}
          <a href={urlCheckConnectionDocumentation} target="_blank">
            document.
          </a>
        </p>
      );
      const missingOSSelection = this.checkMissingOSSelection();
      const ipInput = (
        <EuiText>
          <p>
            This is the address the agent uses to communicate with the Wazuh server. It can be an IP address or a fully qualified domain name (FQDN).
          </p>
          <EuiFieldText
            placeholder="Server address"
            value={this.state.serverAddress}
            onChange={(event) => this.setServerAddress(event)}
          />
        </EuiText>
      );

      const groupInput = (
        <>
          {!this.state.groups.length && (
            <>
              <EuiCallOut
                color="warning"
                title='This section could not be configured because you do not have permission to read groups.'
                iconType="iInCircle"
              />
              <EuiSpacer />
            </>
          )}
          <EuiText>
            <p>Select one or more existing groups</p>
            <EuiComboBox
              placeholder={!this.state.groups.length ? "Default" : "Select group"}
              options={this.state.groups}
              selectedOptions={this.state.selectedGroup}
              onChange={(group) => {
                this.setGroupName(group);
              }}
              isDisabled={!this.state.groups.length}
              isClearable={true}
              data-test-subj="demoComboBox"
            />
          </EuiText>
        </>
      );

      const passwordInput = (
        <EuiFieldText
          placeholder="Wazuh password"
          value={this.state.wazuhPassword}
          onChange={(event) => this.setWazuhPassword(event)}
        />
      );

      const codeBlock = {
        zIndex: '100',
      };
      const customTexts = {
        rpmText: `sudo ${this.optionalDeploymentVariables()}yum install -y ${this.optionalPackages()}`,
        centText: `sudo ${this.optionalDeploymentVariables()}yum install -y ${this.optionalPackages()}`,
        debText: `curl -so wazuh-agent-${this.state.wazuhVersion
          }.deb ${this.optionalPackages()} && sudo ${this.optionalDeploymentVariables()}dpkg -i ./wazuh-agent-${this.state.wazuhVersion
          }.deb`,
        ubuText: `curl -so wazuh-agent-${this.state.wazuhVersion
          }.deb ${this.optionalPackages()} && sudo ${this.optionalDeploymentVariables()}dpkg -i ./wazuh-agent-${this.state.wazuhVersion
          }.deb`,
        macosText: `curl -so wazuh-agent-${this.state.wazuhVersion
          }.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-${this.state.wazuhVersion
          }-1.pkg && sudo launchctl setenv ${this.optionalDeploymentVariables()} && sudo installer -pkg ./wazuh-agent-${this.state.wazuhVersion
          }.pkg -target /`,
        winText: `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-${this.state.wazuhVersion
          }-1.msi -OutFile \${env:tmp}\\wazuh-agent-${this.state.wazuhVersion}.msi; msiexec.exe /i \${env:tmp}\\wazuh-agent-${this.state.wazuhVersion
          }.msi /q ${this.optionalDeploymentVariables()}`,
        openText: `sudo rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH && sudo ${this.optionalDeploymentVariables()} zypper install -y ${this.optionalPackages()}`,
        solText: `sudo curl -so ${this.optionalPackages()} && ${this.state.selectedVersion == 'solaris11' ? 'pkg install -g wazuh-agent.p5p wazuh-agent' : 'pkgadd -d wazuh-agent.pkg'}`,
        aixText: `sudo ${this.optionalDeploymentVariables()} rpm -ivh ${this.optionalPackages()}`,
        hpText: `cd / && sudo curl -so ${this.optionalPackages()} && sudo groupadd wazuh && sudo useradd -G wazuh wazuh && sudo tar -xvf wazuh-agent.tar`,
      };

      const field = `${this.state.selectedOS}Text`;
      const text = customTexts[field];
      const language = this.getHighlightCodeLanguage(this.state.selectedOS);
      const windowsAdvice = this.state.selectedOS === 'win' && (
        <>
          <EuiCallOut
            title="Requirements"
            iconType="iInCircle"
          >
            <ul class="wz-callout-list">
              <li><span>You will need administrator privileges to perform this installation.</span></li>
              <li><span>PowerShell 3.0 or greater is required.</span></li>
            </ul>
            <p>Keep in mind you need to run this command in a Windows PowerShell terminal.</p>
          </EuiCallOut>
          <EuiSpacer></EuiSpacer>
        </>
      );
      const restartAgentCommand = this.restartAgentCommand[this.state.selectedOS];
      const onTabClick = (selectedTab) => {
        this.selectSYS(selectedTab.id);
      };

      const calloutErrorRegistrationServiceInfo = this.state.gotErrorRegistrationServiceInfo ? (
        <EuiCallOut
          color="danger"
          title='This section could not be displayed because you do not have permission to get access to the registration service.'
          iconType="iInCircle"
        />
      ) : null;

      const guide = (
        <div>
          {(this.state.gotErrorRegistrationServiceInfo) ? (
            <EuiCallOut
              color="danger"
              title='This section could not be displayed because you do not have permission to get access to the registration service.'
              iconType="iInCircle"
            />
          ) :
            this.state.selectedOS && (
              <EuiText>
                <p>
                  You can use this command to install and enroll the Wazuh agent in one or more hosts.
                </p>
                <EuiCallOut
                  color="warning"
                  title={
                    <>
                      If the installer finds another Wazuh agent in the system, it will upgrade it preserving the configuration.
                    </>
                  }
                  iconType="iInCircle"
                />
                <EuiSpacer />
                {windowsAdvice}
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.state.wazuhPassword && !this.state.showPassword ? this.obfuscatePassword(text) : text}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={text}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                {this.state.needsPassword && (
                  <EuiSwitch
                    label="Show password"
                    checked={this.state.showPassword}
                    onChange={(active) => this.setShowPassword(active)}
                  />
                )}
                <EuiSpacer />
              </EuiText>
            )}
        </div>
      );

      const tabs = [
        {
          id: 'sysV',
          name: 'SysV Init',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelector()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelector()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        },
        {
          id: 'upstart',
          name: 'Upstart',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorUpstart()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorUpstart()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        }
      ];

      const tabSysV = [
        {
          id: 'sysV',
          name: 'SysV Init',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelector()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelector()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        },
      ];

      const tabSystemD = [
        {
          id: 'systemd',
          name: 'Systemd',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelector()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelector()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        },
      ];

      const tabNet = [
        {
          id: 'NET',
          name: 'NET',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorNet()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorNet()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        },
      ];

      const tabWazuhControlMacos = [
        {
          id: 'Wazuh-control-macos',
          name: 'Wazuh-control-macos',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorWazuhControlMacos()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorWazuhControlMacos()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        },
      ];

      const tabWazuhControl = [
        {
          id: 'Wazuh-control',
          name: 'Wazuh-control',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className="copy-codeblock-wrapper">
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorWazuhControl()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorWazuhControl()}>
                    {(copy) => (
                      <div className="copy-overlay" onClick={copy}>
                        <p><EuiIcon type="copy" /> Copy command</p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                <EuiSpacer size='s' />
                {textAndLinkToCheckConnectionDocumentation}
              </EuiText>
            </Fragment>
          ),
        },
      ];

      const buttonGroup = (legend, options, idSelected, onChange) => {
        return (
          <EuiButtonGroup
            color="primary"
            legend={legend}
            options={options}
            idSelected={idSelected}
            onChange={onChange}
          />
        )
      }

      const steps = [
        {
          title: 'Choose the Operating system',
          children: (
            buttonGroup("Choose the Operating system", osButtons, this.state.selectedOS, (os) => this.selectOS(os))
          ),
        },
        ...(this.state.selectedOS == 'rpm'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsRedHat, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'cent'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsCentos, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'deb'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsDebian, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'ubu'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsUbuntu, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'win'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsWindows, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'macos'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsMacOS, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'open'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsOpenSuse, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'sol'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsSolaris, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'aix'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsAix, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedOS == 'hp'
          ? [
            {
              title: 'Choose the version',
              children: (
                buttonGroup("Choose the version", versionButtonsHPUX, this.state.selectedVersion, (version) => this.setVersion(version))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == 'centos5' || this.state.selectedVersion == 'redhat5'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureCentos5OrRedHat5, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == 'leap15'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureButtonsOpenSuse, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == 'centos6' || this.state.selectedVersion == 'centos7' || this.state.selectedVersion == 'redhat6' || this.state.selectedVersion == 'redhat7' || this.state.selectedVersion == 'debian7' || this.state.selectedVersion == 'debian8' || this.state.selectedVersion == 'debian10' || this.state.selectedVersion == 'ubuntu14' || this.state.selectedVersion == 'ubuntu15' || this.state.selectedVersion == 'ubuntu16'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureButtons, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == 'windowsxp' || this.state.selectedVersion == 'windows8' || this.state.selectedVersion == 'sierra'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureButtonsi386, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == 'solaris10' || this.state.selectedVersion == 'solaris11'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureButtonsSolaris, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == '6.1 TL9'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureButtonsAix, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        ...(this.state.selectedVersion == '11.31'
          ? [
            {
              title: 'Choose the architecture',
              children: (
                buttonGroup("Choose the architecture", architectureButtonsHpUx, this.state.selectedArchitecture, (architecture) => this.setArchitecture(architecture))
              ),
            },
          ]
          : []),
        {
          title: 'Wazuh server address',
          children: <Fragment>{ipInput}</Fragment>,
        },
        ...(!(!this.state.needsPassword || this.state.hidePasswordInput)
          ? [
            {
              title: 'Wazuh password',
              children: <Fragment>{passwordInput}</Fragment>,
            },
          ]
          : []),
        {
          title: 'Assign the agent to a group',
          children: <Fragment>{groupInput}</Fragment>,
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
              <div>{guide}</div>
            ),
        },
        ...(this.state.selectedOS == 'rpm' || this.state.selectedOS == 'cent' || this.state.selectedOS == 'deb' || this.state.selectedOS == 'ubu' || this.state.selectedOS == 'win' || this.state.selectedOS == 'macos' || this.state.selectedOS == 'open' || this.state.selectedOS == 'sol' || this.state.selectedOS == 'aix' || this.state.selectedOS == 'hp'
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
                  <EuiTabbedContent
                    tabs={this.state.selectedVersion == 'redhat7' || this.state.selectedVersion == 'centos7' || this.state.selectedVersion == 'debian8' || this.state.selectedVersion == 'debian10' || this.state.selectedVersion === 'ubuntu15' || this.state.selectedVersion === 'ubuntu16' || this.state.selectedVersion === 'leap15' ? tabSystemD : this.state.selectedVersion == 'ubuntu14' ? tabs : this.state.selectedVersion == 'windowsxp' || this.state.selectedVersion == 'windows8' ? tabNet : this.state.selectedVersion == 'sierra' ? tabWazuhControlMacos : this.state.selectedVersion == 'solaris10' || this.state.selectedVersion == 'solaris11' || this.state.selectedVersion == '6.1 TL9' || this.state.selectedVersion == '11.31' ? tabWazuhControl : tabSysV}
                    selectedTab={this.selectedSYS}
                    onTabClick={onTabClick}
                  />
                ),
            },
          ]
          : []),

        ...(!missingOSSelection.length &&
          this.state.selectedOS !== 'rpm' &&
          this.state.selectedOS !== 'deb' &&
          this.state.selectedOS !== 'cent' &&
          this.state.selectedOS !== 'ubu' &&
          this.state.selectedOS !== 'win' &&
          this.state.selectedOS !== 'macos' &&
          this.state.selectedOS !== 'open' &&
          this.state.selectedOS !== 'sol' &&
          this.state.selectedOS !== 'aix' &&
          this.state.selectedOS !== 'hp' &&
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
                        <EuiCodeBlock style={codeBlock} language={language}>
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
