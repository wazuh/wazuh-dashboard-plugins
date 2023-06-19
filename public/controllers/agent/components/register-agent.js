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
  EuiSwitch,
  EuiLink,
  EuiFormRow,
  EuiForm,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import {
  architectureButtons,
  architectureButtonsi386,
  architecturei386Andx86_64,
  versionButtonsRaspbian,
  versionButtonsSuse,
  versionButtonsOracleLinux,
  versionButtonFedora,
  architectureButtonsSolaris,
  architectureButtonsWithPPC64LE,
  architectureButtonsAix,
  architectureButtonsHpUx,
  versionButtonAmazonLinux,
  versionButtonsRedHat,
  versionButtonsCentos,
  architectureButtonsMacos,
  osPrincipalButtons,
  versionButtonsDebian,
  versionButtonsUbuntu,
  versionButtonsWindows,
  versionButtonsMacOS,
  versionButtonsOpenSuse,
  versionButtonsSolaris,
  versionButtonsAix,
  versionButtonsHPUX,
  versionButtonAlpine,
  architectureButtonsWithPPC64LEAlpine,
} from '../wazuh-config';
import WzManagerAddressInput from '../register-agent/steps/wz-manager-address';
import { getMasterRemoteConfiguration } from './register-agent-service';
import { PrincipalButtonGroup } from './wz-accordion';
import RegisterAgentButtonGroup from '../register-agent/register-agent-button-group';
import '../../../styles/common.scss';

export const RegisterAgent = withErrorBoundary(
  class RegisterAgent extends Component {
    constructor(props) {
      super(props);
      this.wazuhConfig = new WazuhConfig();
      this.configuration = this.wazuhConfig.getConfig();
      this.addToVersion = '-1';

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
        agentName: '',
        agentNameError: false,
        badCharacters: [],
        wazuhPassword: '',
        groups: [],
        selectedGroup: [],
        defaultServerAddress: '',
        udpProtocol: false,
        showPassword: false,
        showProtocol: true,
        connectionSecure: true,
        isAccordionOpen: false,
      };
      this.restartAgentCommand = {
        rpm: this.systemSelector(),
        cent: this.systemSelector(),
        deb: this.systemSelector(),
        ubu: this.systemSelector(),
        oraclelinux: this.systemSelector(),
        macos: this.systemSelectorWazuhControlMacos(),
        win: this.systemSelectorNet(),
      };
    }

    async componentDidMount() {
      try {
        this.setState({ loading: true });
        const wazuhVersion = await this.props.getWazuhVersion();
        let wazuhPassword = '';
        let hidePasswordInput = false;
        this.getEnrollDNSConfig();
        await this.getRemoteConfig();
        let authInfo = await this.getAuthInfo();
        const needsPassword = (authInfo.auth || {}).use_password === 'yes';
        if (needsPassword) {
          wazuhPassword =
            this.configuration['enrollment.password'] ||
            authInfo['authd.pass'] ||
            '';
          if (wazuhPassword) {
            hidePasswordInput = true;
          }
        }
        const groups = await this.getGroups();
        this.setState({
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
          versionButtonAmazonLinux,
          versionButtonsSuse,
          versionButtonsAix,
          versionButtonsHPUX,
          versionButtonsOracleLinux,
          versionButtonsRaspbian,
          versionButtonFedora,
          architectureButtons,
          architectureButtonsi386,
          architecturei386Andx86_64,
          architectureButtonsSolaris,
          architectureButtonsAix,
          architectureButtonsHpUx,
          architectureButtonsMacos,
          architectureButtonsWithPPC64LE,
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
          display: true,
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

    getEnrollDNSConfig = () => {
      const serverAddress = this.configuration['enrollment.dns'] || '';
      this.setState({ defaultServerAddress: serverAddress });
    };

    getRemoteConfig = async () => {
      const remoteConfig = await getMasterRemoteConfiguration();
      if (remoteConfig) {
        this.setState({
          haveUdpProtocol: remoteConfig.isUdp,
          haveConnectionSecure: remoteConfig.haveSecureConnection,
          udpProtocol: remoteConfig.isUdp,
          connectionSecure: remoteConfig.haveSecureConnection,
        });
      }
    };

    async getAuthInfo() {
      try {
        const result = await WzRequest.apiReq(
          'GET',
          '/agents/000/config/auth/auth',
          {},
        );
        return (result.data || {}).data || {};
      } catch (error) {
        this.setState({ gotErrorRegistrationServiceInfo: true });
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
      if (
        this.state.selectedVersion === 'redhat7' ||
        this.state.selectedVersion === 'amazonlinux2022' ||
        this.state.selectedVersion === 'centos7' ||
        this.state.selectedVersion === 'suse11' ||
        this.state.selectedVersion === 'suse12' ||
        this.state.selectedVersion === 'oraclelinux5' ||
        this.state.selectedVersion === '22' ||
        this.state.selectedVersion === 'amazonlinux2' ||
        this.state.selectedVersion === 'debian8' ||
        this.state.selectedVersion === 'debian9' ||
        this.state.selectedVersion === 'debian10' ||
        this.state.selectedVersion === 'busterorgreater' ||
        this.state.selectedVersion === 'ubuntu15' ||
        this.state.selectedVersion === 'leap15'
      ) {
        return 'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';
      } else if (
        this.state.selectedVersion === 'redhat5' ||
        this.state.selectedVersion === 'redhat6' ||
        this.state.selectedVersion === 'centos5' ||
        this.state.selectedVersion === 'centos6' ||
        this.state.selectedVersion === 'oraclelinux6' ||
        this.state.selectedVersion === 'amazonlinux1' ||
        this.state.selectedVersion === 'debian7' ||
        this.state.selectedVersion === 'ubuntu14'
      ) {
        return 'service wazuh-agent start';
      } else {
        return '';
      }
    }

    systemSelectorNet() {
      if (
        this.state.selectedVersion === 'windowsxp' ||
        this.state.selectedVersion === 'windowsserver2008' ||
        this.state.selectedVersion === 'windows7'
      ) {
        return 'NET START Wazuh';
      } else {
        return '';
      }
    }

    systemSelectorWazuhControlMacos() {
      if (this.state.selectedVersion == 'sierra') {
        return 'sudo /Library/Ossec/bin/wazuh-control start';
      } else {
        return '';
      }
    }

    systemSelectorWazuhControl() {
      if (
        this.state.selectedVersion === 'solaris10' ||
        this.state.selectedVersion === 'solaris11' ||
        this.state.selectedVersion === '6.1 TL9' ||
        this.state.selectedVersion === '3.12.12'
      ) {
        return '/var/ossec/bin/wazuh-control start';
      } else {
        return '';
      }
    }

    systemSelectorInitD() {
      if (this.state.selectedVersion === '11.31') {
        return '/sbin/init.d/wazuh-agent start';
      } else {
        return '';
      }
    }

    selectSYS(sys) {
      this.setState({ selectedSYS: sys });
    }

    setServerAddress(serverAddress) {
      this.setState({ serverAddress });
    }

    setAgentName(event) {
      const validation = /^[a-z0-9-_.]+$/i;
      if (
        (validation.test(event.target.value) &&
          event.target.value.length >= 2) ||
        event.target.value.length <= 0
      ) {
        this.setState({
          agentName: event.target.value,
          agentNameError: false,
          badCharacters: [],
        });
      } else {
        let badCharacters = event.target.value
          .split('')
          .map(char => char.replace(validation, ''))
          .join('');
        badCharacters = badCharacters
          .split('')
          .map(char => char.replace(/\s/, 'whitespace'));
        const characters = [...new Set(badCharacters)];
        this.setState({
          agentName: event.target.value,
          badCharacters: characters,
          agentNameError: true,
        });
      }
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
      const regex = /WAZUH_REGISTRATION_PASSWORD=?\040?\'(.*?)\'[\"| ]/gm;
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
        return result.data.data.affected_items.map(item => ({
          label: item.name,
          id: item.name,
        }));
      } catch (error) {
        throw new Error(error);
      }
    }

    optionalDeploymentVariables() {
      const escapeQuotes = value => value.replace(/'/g, "\\'");
      let deployment =
        this.state.serverAddress &&
        `WAZUH_MANAGER='${escapeQuotes(this.state.serverAddress)}' `;
      if (this.state.selectedOS == 'win') {
        deployment += `WAZUH_REGISTRATION_SERVER='${escapeQuotes(
          this.state.serverAddress,
        )}' `;
      }

      if (this.state.needsPassword) {
        deployment += `WAZUH_REGISTRATION_PASSWORD='${escapeQuotes(
          this.state.wazuhPassword,
        )}' `;
      }

      if (this.state.udpProtocol) {
        deployment += "WAZUH_PROTOCOL='UDP' ";
      }

      if (this.state.selectedGroup.length) {
        deployment += `WAZUH_AGENT_GROUP='${this.state.selectedGroup
          .map(item => item.label)
          .join(',')}' `;
      }

      return deployment;
    }

    agentNameVariable() {
      let agentName = `WAZUH_AGENT_NAME='${this.state.agentName}' `;
      if (this.state.selectedArchitecture && this.state.agentName !== '') {
        return agentName;
      } else {
        return '';
      }
    }

    resolveRPMPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'redhat5-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.i386.rpm`;
        case 'redhat5-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.x86_64.rpm`;
        case 'redhat6-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'redhat6-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'redhat6-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'redhat6-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'redhat7-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'redhat7-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'redhat7-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'redhat7-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'redhat7-powerpc':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.ppc64le.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveAlpinePackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case '3.12.12-i386':
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
        case '3.12.12-aarch64':
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
        case '3.12.12-x86_64':
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
        case '3.12.12-x86':
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
        case '3.12.12-armhf':
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
        case '3.12.12-powerpc':
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
        default:
          return 'https://packages.wazuh.com/key/alpine-devel%40wazuh.com-633d7457.rsa.pub && echo "https://packages.wazuh.com/4.x/alpine/v3.12/main"';
      }
    }

    resolveORACLELINUXPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'oraclelinux5-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.i386.rpm`;
        case 'oraclelinux5-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.x86_64.rpm`;
        case 'oraclelinux6-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'oraclelinux6-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'oraclelinux6-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'oraclelinux6-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveCENTPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'centos5-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.i386.rpm`;
        case 'centos5-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.x86_64.rpm`;
        case 'centos6-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'centos6-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'centos6-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'centos6-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'centos7-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'centos7-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'centos7-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'centos7-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'centos7-powerpc':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.ppc64le.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveSUSEPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'suse11-i386':
          return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.i386.rpm`;
        case 'suse11-x86_64':
          return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.el5.x86_64.rpm`;
        case 'suse12-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'suse12-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'suse12-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'suse12-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'suse12-powerpc':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.ppc64le.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveFEDORAPachage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case '22-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case '22-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case '22-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case '22-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case '22-powerpc':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.ppc64le.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveAMAZONLPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'amazonlinux1-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'amazonlinux1-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'amazonlinux1-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'amazonlinux1-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'amazonlinux2-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'amazonlinux2-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'amazonlinux2-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'amazonlinux2-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'amazonlinux2022-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'amazonlinux2022-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'amazonlinux2022-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'amazonlinux2022-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveDEBPackage() {
      switch (`${this.state.selectedArchitecture}`) {
        case 'i386':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_i386.deb`;
        case 'aarch64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_arm64.deb`;
        case 'armhf':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_armhf.deb`;
        case 'x86_64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
        case 'powerpc':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_ppc64el.deb`;
        default:
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
      }
    }

    resolveRASPBIANPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'busterorgreater-i386':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_i386.deb`;
        case 'busterorgreater-aarch64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_arm64.deb`;
        case 'busterorgreater-armhf':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_armhf.deb`;
        case 'busterorgreater-x86_64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
        case 'busterorgreater-powerpc':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_ppc64el.deb`;
        default:
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
      }
    }

    resolveUBUNTUPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'ubuntu14-i386':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_i386.deb`;
        case 'ubuntu14-aarch64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_arm64.deb`;
        case 'ubuntu14-armhf':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_armhf.deb`;
        case 'ubuntu14-x86_64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
        case 'ubuntu15-i386':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_i386.deb`;
        case 'ubuntu15-aarch64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_arm64.deb`;
        case 'ubuntu15-armhf':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_armhf.deb`;
        case 'ubuntu15-x86_64':
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
        default:
          return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${this.state.wazuhVersion}${this.addToVersion}_amd64.deb`;
      }
    }

    resolveOPENSUSEPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'leap15-i386':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.i386.rpm`;
        case 'leap15-aarch64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aarch64.rpm`;
        case 'leap15-x86_64':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
        case 'leap15-armhf':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.armv7hl.rpm`;
        case 'leap15-powerpc':
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.ppc64le.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
      }
    }

    resolveSOLARISPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case 'solaris10-i386':
          return `https://packages.wazuh.com/4.x/solaris/i386/10/wazuh-agent_v${this.state.wazuhVersion}-sol10-i386.pkg`;
        case 'solaris10-sparc':
          return `https://packages.wazuh.com/4.x/solaris/sparc/10/wazuh-agent_v${this.state.wazuhVersion}-sol10-sparc.pkg`;
        case 'solaris11-i386':
          return `https://packages.wazuh.com/4.x/solaris/i386/11/wazuh-agent_v${this.state.wazuhVersion}-sol11-i386.p5p`;
        case 'solaris11-sparc':
          return `https://packages.wazuh.com/4.x/solaris/sparc/11/wazuh-agent_v${this.state.wazuhVersion}-sol11-sparc.p5p`;
        default:
          return `https://packages.wazuh.com/4.x/solaris/sparc/11/wazuh-agent_v${this.state.wazuhVersion}-sol11-sparc.p5p`;
      }
    }

    resolveAIXPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case '6.1 TL9-powerpc':
          return `https://packages.wazuh.com/4.x/aix/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aix.ppc.rpm`;
        default:
          return `https://packages.wazuh.com/4.x/aix/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.aix.ppc.rpm`;
      }
    }

    resolveHPPackage() {
      switch (
        `${this.state.selectedVersion}-${this.state.selectedArchitecture}`
      ) {
        case '11.31-itanium2':
          return `https://packages.wazuh.com/4.x/hp-ux/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}-hpux-11v3-ia64.tar`;
        default:
          return `https://packages.wazuh.com/4.x/hp-ux/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}-hpux-11v3-ia64.tar`;
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
        case 'amazonlinux':
          return this.resolveAMAZONLPackage();
        case 'fedora':
          return this.resolveFEDORAPachage();
        case 'oraclelinux':
          return this.resolveORACLELINUXPackage();
        case 'suse':
          return this.resolveSUSEPackage();
        case 'raspbian':
          return this.resolveRASPBIANPackage();
        case 'alpine':
          return this.resolveAlpinePackage();
        default:
          return `https://packages.wazuh.com/4.x/yum/x86_64/wazuh-agent-${this.state.wazuhVersion}${this.addToVersion}.x86_64.rpm`;
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
        case 'amazonlinux':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'fedora':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'oraclelinux':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'suse':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'raspbian':
          return [
            ...(!this.state.selectedVersion ? ['OS version'] : []),
            ...(this.state.selectedVersion && !this.state.selectedArchitecture
              ? ['OS architecture']
              : []),
          ];
        case 'alpine':
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
      const appVersionMajorDotMinor = this.state.wazuhVersion
        .split('.')
        .slice(0, 2)
        .join('.');
      const urlCheckConnectionDocumentation = webDocumentationLink(
        'user-manual/agents/agent-connection.html',
        appVersionMajorDotMinor,
      );

      const urlWazuhAgentEnrollment = webDocumentationLink(
        'user-manual/agent-enrollment/index.html',
        appVersionMajorDotMinor,
      );

      const urlWindowsPackage = `https://packages.wazuh.com/4.x/windows/wazuh-agent-${this.state.wazuhVersion}-1.msi`;
      const missingOSSelection = this.checkMissingOSSelection();
      const warningForAgentName =
        'The agent name must be unique. It can’t be changed once the agent has been enrolled.';

      const agentName = (
        <EuiText>
          <p>
            The deployment sets the endpoint hostname as the agent name by
            default. Optionally, you can set the agent name below.
          </p>
          <EuiText color='default'>Assign an agent name</EuiText>
          <EuiSpacer />
          <EuiForm>
            <EuiFormRow
              isInvalid={this.state.agentNameError}
              error={[
                this.state.badCharacters.length < 1
                  ? 'The minimum length is 2 characters.'
                  : `The character${
                      this.state.badCharacters.length <= 1 ? '' : 's'
                    }
            ${this.state.badCharacters.map(char => ` "${char}"`)}
            ${this.state.badCharacters.length <= 1 ? 'is' : 'are'}
            not valid. Allowed characters are A-Z, a-z, ".", "-", "_"`,
              ]}
            >
              <EuiFieldText
                isInvalid={this.state.agentNameError}
                placeholder='Agent name'
                value={this.state.agentName}
                onChange={event => this.setAgentName(event)}
              />
            </EuiFormRow>
          </EuiForm>
          <EuiSpacer size='s' />
          <EuiCallOut
            color='warning'
            title={warningForAgentName}
            iconType='iInCircle'
          />
        </EuiText>
      );
      const groupInput = (
        <>
          {!this.state.groups.length && (
            <>
              <EuiCallOut
                style={{ marginTop: '1.5rem' }}
                color='warning'
                title='This section could not be configured because you do not have permission to read groups.'
                iconType='iInCircle'
              />
            </>
          )}
        </>
      );

      const agentGroup = (
        <EuiText style={{ marginTop: '1.5rem' }}>
          <p>Select one or more existing groups</p>
          <EuiComboBox
            placeholder={!this.state.groups.length ? 'Default' : 'Select group'}
            options={this.state.groups}
            selectedOptions={this.state.selectedGroup}
            onChange={group => {
              this.setGroupName(group);
            }}
            isDisabled={!this.state.groups.length}
            isClearable={true}
            data-test-subj='demoComboBox'
          />
        </EuiText>
      );
      const passwordInput = (
        <EuiFieldText
          placeholder='Wazuh password'
          value={this.state.wazuhPassword}
          onChange={event => this.setWazuhPassword(event)}
        />
      );

      const codeBlock = {
        zIndex: '100',
      };

      /*** macOS installation script customization ***/

      // Set macOS installation script with environment variables
      const macOSInstallationOptions =
        `${this.optionalDeploymentVariables()}${this.agentNameVariable()}`
          .replace(/\' ([a-zA-Z])/g, "' && $1") // Separate environment variables with &&
          .replace(/\"/g, '\\"') // Escape double quotes
          .trim();

      // If no variables are set, the echo will be empty
      const macOSInstallationSetEnvVariablesScript = macOSInstallationOptions
        ? `sudo echo "${macOSInstallationOptions}" > /tmp/wazuh_envs && `
        : ``;

      // Merge environment variables with installation script
      const macOSInstallationScript = `curl -so wazuh-agent.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-${this.state.wazuhVersion}-1.${this.state.selectedArchitecture}.pkg && ${macOSInstallationSetEnvVariablesScript}sudo installer -pkg ./wazuh-agent.pkg -target /`;

      /*** end macOS installation script customization ***/

      const customTexts = {
        rpmText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}yum install -y ${this.optionalPackages()}`,
        alpineText: `wget -O /etc/apk/keys/alpine-devel@wazuh.com-633d7457.rsa.pub ${this.optionalPackages()} >> /etc/apk/repositories && \
apk update && \
apk add wazuh-agent=${this.state.wazuhVersion}-r1`,
        centText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}yum install -y ${this.optionalPackages()}`,
        debText: `curl -so wazuh-agent.deb ${this.optionalPackages()} && sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}dpkg -i ./wazuh-agent.deb`,
        ubuText: `curl -so wazuh-agent.deb ${this.optionalPackages()} && sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}dpkg -i ./wazuh-agent.deb`,
        macosText: macOSInstallationScript,
        winText:
          this.state.selectedVersion == 'windowsxp' ||
          this.state.selectedVersion == 'windowsserver2008'
            ? `msiexec.exe /i wazuh-agent-${
                this.state.wazuhVersion
              }-1.msi /q ${this.optionalDeploymentVariables()}${this.agentNameVariable()}`
            : `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-${
                this.state.wazuhVersion
              }-1.msi -OutFile \${env:tmp}\\wazuh-agent.msi; msiexec.exe /i \${env:tmp}\\wazuh-agent.msi /q ${this.optionalDeploymentVariables()}${this.agentNameVariable()}`,
        openText: `sudo rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH && sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}zypper install -y ${this.optionalPackages()}`,
        solText: `sudo curl -so ${
          this.state.selectedVersion == 'solaris11'
            ? 'wazuh-agent.p5p'
            : 'wazuh-agent.pkg'
        } ${this.optionalPackages()} && ${
          this.state.selectedVersion == 'solaris11'
            ? 'pkg install -g wazuh-agent.p5p wazuh-agent'
            : 'pkgadd -d wazuh-agent.pkg'
        }`,
        aixText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}rpm -ivh ${this.optionalPackages()}`,
        hpText: `cd / && sudo curl -so wazuh-agent.tar ${this.optionalPackages()} && sudo groupadd wazuh && sudo useradd -G wazuh wazuh && sudo tar -xvf wazuh-agent.tar`,
        amazonlinuxText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}yum install -y ${this.optionalPackages()}`,
        fedoraText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}yum install -y ${this.optionalPackages()}`,
        oraclelinuxText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}yum install -y ${this.optionalPackages()}`,
        suseText: `sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}yum install -y ${this.optionalPackages()}`,
        raspbianText: `curl -so wazuh-agent.deb ${this.optionalPackages()} && sudo ${this.optionalDeploymentVariables()}${this.agentNameVariable()}dpkg -i ./wazuh-agent.deb`,
      };

      const field = `${this.state.selectedOS}Text`;
      const text = customTexts[field];
      const language = this.getHighlightCodeLanguage(this.state.selectedOS);
      const warningUpgrade =
        'If the installer finds another Wazuh agent in the system, it will upgrade it preserving the configuration.';
      const textAndLinkToCheckConnectionDocumentation = (
        <p>
          To verify the connection with the Wazuh server, please follow this{' '}
          <a
            href={urlCheckConnectionDocumentation}
            target='_blank'
            rel='noreferrer'
          >
            document.
          </a>
        </p>
      );

      const warningCommand = (
        <>
          <p>
            Please
            <a href={urlWindowsPackage}> download </a>
            the package from our repository and copy it to the Windows system
            where you are going to install it. Then run the following command to
            perform the installation:
          </p>
        </>
      );

      const windowsAdvice = this.state.selectedOS === 'win' && (
        <>
          <EuiCallOut title='Requirements' iconType='iInCircle'>
            <ul className='wz-callout-list'>
              <li>
                <span>
                  You will need administrator privileges to perform this
                  installation.
                </span>
              </li>
              <li>
                <span>PowerShell 3.0 or greater is required.</span>
              </li>
            </ul>
            <p>
              Keep in mind you need to run this command in a Windows PowerShell
              terminal.
            </p>
          </EuiCallOut>
          <EuiSpacer></EuiSpacer>
        </>
      );
      const restartAgentCommand =
        this.restartAgentCommand[this.state.selectedOS];
      const onTabClick = selectedTab => {
        this.selectSYS(selectedTab.id);
      };

      const calloutErrorRegistrationServiceInfo = this.state
        .gotErrorRegistrationServiceInfo ? (
        <EuiCallOut
          color='danger'
          title='This section could not be displayed because you do not have permission to get access to the registration service.'
          iconType='iInCircle'
        />
      ) : null;

      const guide = (
        <div>
          {this.state.gotErrorRegistrationServiceInfo ? (
            <EuiCallOut
              color='danger'
              title='This section could not be displayed because you do not have permission to get access to the registration service.'
              iconType='iInCircle'
            />
          ) : (
            this.state.selectedOS && (
              <EuiText>
                {this.state.agentName.length > 0 ? (
                  <p>
                    You can use this command to install and enroll the Wazuh
                    agent.
                  </p>
                ) : (
                  <p>
                    You can use this command to install and enroll the Wazuh
                    agent in one or more hosts.
                  </p>
                )}
                <EuiCallOut
                  color='warning'
                  title={warningUpgrade}
                  iconType='iInCircle'
                />

                {!this.state.connectionSecure && (
                  <>
                    <EuiSpacer />
                    {/** Warning connection NO SECURE */}
                    <EuiCallOut
                      color='danger'
                      title={
                        <>
                          Warning: there's no{' '}
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'user-manual/deployment-variables/deployment-variables.html',
                              appVersionMajorDotMinor,
                            )}
                          >
                            secure protocol configured
                          </EuiLink>{' '}
                          and agents will not be able to communicate with the
                          manager.
                        </>
                      }
                      iconType='iInCircle'
                    />
                    {/** END Warning connection NO SECURE */}
                  </>
                )}
                <EuiSpacer />
                {windowsAdvice}
                {['windowsxp', 'windowsserver2008'].includes(
                  this.state.selectedVersion,
                ) && (
                  <>
                    <EuiCallOut
                      color='warning'
                      title={warningCommand}
                      iconType='iInCircle'
                    />
                    <EuiSpacer />
                  </>
                )}
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.state.wazuhPassword &&
                    !this.state.showPassword &&
                    !['sol', 'hp', 'alpine'].includes(this.state.selectedOS)
                      ? this.obfuscatePassword(text)
                      : text}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={text || ''}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
                      </div>
                    )}
                  </EuiCopy>
                </div>
                {this.state.selectedVersion == 'solaris10' ||
                this.state.selectedVersion == 'solaris11' ? (
                  <>
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          Might require some extra installation{' '}
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'installation-guide/wazuh-agent/wazuh-agent-package-solaris.html',
                              appVersionMajorDotMinor,
                            )}
                          >
                            steps
                          </EuiLink>
                          .
                        </span>
                      }
                    ></EuiCallOut>
                    <EuiSpacer size='m' />
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          After installing the agent, you need to enroll it in
                          the Wazuh server. Check the Wazuh agent enrollment{' '}
                          <EuiLink
                            target='_blank'
                            href={urlWazuhAgentEnrollment}
                          >
                            Wazuh agent enrollment
                          </EuiLink>{' '}
                          section to learn more.
                        </span>
                      }
                    ></EuiCallOut>
                  </>
                ) : this.state.selectedVersion == '6.1 TL9' ? (
                  <>
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          Might require some extra installation{' '}
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'installation-guide/wazuh-agent/wazuh-agent-package-aix.html',
                              appVersionMajorDotMinor,
                            )}
                          >
                            steps
                          </EuiLink>
                          .
                        </span>
                      }
                    ></EuiCallOut>
                    <EuiSpacer />
                  </>
                ) : this.state.selectedVersion == '11.31' ? (
                  <>
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          Might require some extra installation{' '}
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'installation-guide/wazuh-agent/wazuh-agent-package-hpux.html',
                              appVersionMajorDotMinor,
                            )}
                          >
                            steps
                          </EuiLink>
                          .
                        </span>
                      }
                    ></EuiCallOut>
                    <EuiSpacer size='m' />
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          After installing the agent, you need to enroll it in
                          the Wazuh server. Check the Wazuh agent enrollment{' '}
                          <EuiLink
                            target='_blank'
                            href={urlWazuhAgentEnrollment}
                          >
                            Wazuh agent enrollment{' '}
                          </EuiLink>
                          section to learn more.
                        </span>
                      }
                    ></EuiCallOut>
                  </>
                ) : this.state.selectedVersion == '3.12.12' ? (
                  <>
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          Might require some extra installation{' '}
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'installation-guide/wazuh-agent/wazuh-agent-package-linux.html',
                              appVersionMajorDotMinor,
                            )}
                          >
                            steps
                          </EuiLink>
                          .
                        </span>
                      }
                    ></EuiCallOut>
                    <EuiSpacer size='m' />
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          After installing the agent, you need to enroll it in
                          the Wazuh server. Check the Wazuh agent enrollment{' '}
                          <EuiLink
                            target='_blank'
                            href={urlWazuhAgentEnrollment}
                          >
                            Wazuh agent enrollment{' '}
                          </EuiLink>
                          section to learn more.
                        </span>
                      }
                    ></EuiCallOut>
                  </>
                ) : this.state.selectedVersion == 'debian7' ||
                  this.state.selectedVersion == 'debian8' ||
                  this.state.selectedVersion == 'debian9' ||
                  this.state.selectedVersion == 'debian10' ? (
                  <>
                    <EuiCallOut
                      color='warning'
                      className='message'
                      iconType='iInCircle'
                      title={
                        <span>
                          Might require some extra installation{' '}
                          <EuiLink
                            target='_blank'
                            href={webDocumentationLink(
                              'installation-guide/wazuh-agent/wazuh-agent-package-linux.html',
                              appVersionMajorDotMinor,
                            )}
                          >
                            steps
                          </EuiLink>
                          .
                        </span>
                      }
                    ></EuiCallOut>
                    <EuiSpacer />
                  </>
                ) : (
                  ''
                )}
                {this.state.needsPassword &&
                !['sol', 'hp', 'alpine'].includes(this.state.selectedOS) ? (
                  <EuiSwitch
                    label='Show password'
                    checked={this.state.showPassword}
                    onChange={active => this.setShowPassword(active)}
                  />
                ) : (
                  ''
                )}
                <EuiSpacer />
              </EuiText>
            )
          )}
        </div>
      );

      const tabSysV = [
        {
          id: 'sysV',
          name: 'SysV Init',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelector()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelector()}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
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
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelector()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelector()}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
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
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorNet()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorNet()}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
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
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorWazuhControlMacos()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorWazuhControlMacos()}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
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
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorWazuhControl()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorWazuhControl()}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
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

      const tabInitD = [
        {
          id: 'Init.d',
          name: 'Init.d',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock style={codeBlock} language={language}>
                    {this.systemSelectorInitD()}
                  </EuiCodeBlock>
                  <EuiCopy textToCopy={this.systemSelectorInitD()}>
                    {copy => (
                      <div className='copy-overlay' onClick={copy}>
                        <p>
                          <EuiIcon type='copy' /> Copy command
                        </p>
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

      const onChangeServerAddress = async nodeSelected => {
        this.setState({
          serverAddress: nodeSelected,
          udpProtocol: this.state.haveUdpProtocol,
          connectionSecure: this.state.haveConnectionSecure,
        });
      };

      const steps = [
        {
          title: 'Choose the operating system',
          children: (
            <PrincipalButtonGroup
              legend='Choose the Operating system'
              options={osPrincipalButtons}
              idSelected={this.state.selectedOS}
              onChange={os => this.selectOS(os)}
            />
          ),
        },
        ...(this.state.selectedOS == 'rpm'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsRedHat}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'oraclelinux'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsOracleLinux}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'raspbian'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsRaspbian}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'amazonlinux'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonAmazonLinux}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'cent'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsCentos}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'fedora'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonFedora}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'deb'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsDebian}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'ubu'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsUbuntu}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'win'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsWindows}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'macos'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsMacOS}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'suse'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsSuse}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'open'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsOpenSuse}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'sol'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsSolaris}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'aix'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsAix}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'hp'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonsHPUX}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'alpine'
          ? [
              {
                title: 'Choose the version',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the version'
                    options={versionButtonAlpine}
                    idSelected={this.state.selectedVersion}
                    onChange={version => this.setVersion(version)}
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'centos5' ||
        this.state.selectedVersion == 'redhat5' ||
        this.state.selectedVersion == 'oraclelinux5' ||
        this.state.selectedVersion == 'suse11'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architecturei386Andx86_64}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'leap15'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsWithPPC64LE}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == '3.12.12'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsWithPPC64LEAlpine}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'centos6' ||
        this.state.selectedVersion == 'oraclelinux6' ||
        this.state.selectedVersion == 'amazonlinux1' ||
        this.state.selectedVersion == 'redhat6' ||
        this.state.selectedVersion == 'amazonlinux2022' ||
        this.state.selectedVersion == 'amazonlinux2' ||
        this.state.selectedVersion == 'debian7' ||
        this.state.selectedVersion == 'debian8' ||
        this.state.selectedVersion == 'ubuntu14' ||
        this.state.selectedVersion == 'ubuntu15'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtons}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'centos7' ||
        this.state.selectedVersion == 'redhat7' ||
        this.state.selectedVersion == 'suse12' ||
        this.state.selectedVersion == '22' ||
        this.state.selectedVersion == 'debian9' ||
        this.state.selectedVersion == 'busterorgreater'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsWithPPC64LE}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'windowsxp' ||
        this.state.selectedVersion == 'windowsserver2008' ||
        this.state.selectedVersion == 'windows7'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsi386}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'sierra'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsMacos}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'solaris10' ||
        this.state.selectedVersion == 'solaris11'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsSolaris}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == '6.1 TL9'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsAix}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == '11.31'
          ? [
              {
                title: 'Choose the architecture',
                children: (
                  <RegisterAgentButtonGroup
                    legend='Choose the architecture'
                    options={architectureButtonsHpUx}
                    idSelected={this.state.selectedArchitecture}
                    onChange={architecture =>
                      this.setArchitecture(architecture)
                    }
                  />
                ),
              },
            ]
          : []),
        ...(!(
          this.state.selectedOS == 'hp' ||
          this.state.selectedOS == 'sol' ||
          this.state.selectedOS == 'alpine'
        )
          ? [
              {
                title: 'Wazuh server address',
                children: (
                  <Fragment>
                    <WzManagerAddressInput
                      defaultValue={this.state.defaultServerAddress}
                      onChange={onChangeServerAddress}
                    />
                  </Fragment>
                ),
              },
            ]
          : []),
        ...(!(
          !this.state.needsPassword ||
          this.state.hidePasswordInput ||
          !!['solaris10', 'solaris11', '11.31', '3.12.12'].includes(
            this.state.selectedVersion,
          )
        )
          ? [
              {
                title: 'Wazuh password',
                children: <Fragment>{passwordInput}</Fragment>,
              },
            ]
          : []),
        ...(!(
          this.state.selectedOS == 'hp' ||
          this.state.selectedOS == 'sol' ||
          this.state.selectedOS == 'alpine'
        )
          ? [
              {
                title: 'Optional settings',
                children: (
                  <Fragment>
                    {agentName}
                    {groupInput}
                    {agentGroup}
                  </Fragment>
                ),
              },
            ]
          : []),
        {
          title: 'Install and enroll the agent',
          children: this.state.gotErrorRegistrationServiceInfo ? (
            calloutErrorRegistrationServiceInfo
          ) : this.state.agentNameError &&
            !['hp', 'sol', 'alpine'].includes(this.state.selectedOS) ? (
            <EuiCallOut
              color='danger'
              title={'There are fields with errors. Please verify them.'}
              iconType='alert'
            />
          ) : missingOSSelection.length ? (
            <EuiCallOut
              color='warning'
              title={`Please select the ${missingOSSelection.join(', ')}.`}
              iconType='iInCircle'
            />
          ) : (
            <div>{guide}</div>
          ),
        },
        ...(this.state.selectedOS == 'rpm' ||
        this.state.selectedOS == 'cent' ||
        this.state.selectedOS == 'suse' ||
        this.state.selectedOS == 'fedora' ||
        this.state.selectedOS == 'oraclelinux' ||
        this.state.selectedOS == 'amazonlinux' ||
        this.state.selectedOS == 'deb' ||
        this.state.selectedOS == 'raspbian' ||
        this.state.selectedOS == 'ubu' ||
        this.state.selectedOS == 'win' ||
        this.state.selectedOS == 'macos' ||
        this.state.selectedOS == 'open' ||
        this.state.selectedOS == 'sol' ||
        this.state.selectedOS == 'aix' ||
        this.state.selectedOS == 'hp' ||
        this.state.selectedOS == 'alpine' ||
        this.state.selectedOS == ''
          ? [
              {
                title: 'Start the agent',
                children: this.state.gotErrorRegistrationServiceInfo ? (
                  calloutErrorRegistrationServiceInfo
                ) : this.state.agentNameError &&
                  !['hp', 'sol', 'alpine'].includes(this.state.selectedOS) ? (
                  <EuiCallOut
                    color='danger'
                    title={'There are fields with errors. Please verify them.'}
                    iconType='alert'
                  />
                ) : missingOSSelection.length ? (
                  <EuiCallOut
                    color='warning'
                    title={`Please select the ${missingOSSelection.join(
                      ', ',
                    )}.`}
                    iconType='iInCircle'
                  />
                ) : (
                  <EuiTabbedContent
                    tabs={
                      this.state.selectedVersion == 'redhat7' ||
                      this.state.selectedVersion == 'amazonlinux2022' ||
                      this.state.selectedVersion == 'centos7' ||
                      this.state.selectedVersion == 'suse11' ||
                      this.state.selectedVersion == 'suse12' ||
                      this.state.selectedVersion == 'amazonlinux2' ||
                      this.state.selectedVersion == '22' ||
                      this.state.selectedVersion == 'debian8' ||
                      this.state.selectedVersion == 'debian9' ||
                      this.state.selectedVersion == 'debian10' ||
                      this.state.selectedVersion == 'busterorgreater' ||
                      this.state.selectedVersion == 'busterorgreater' ||
                      this.state.selectedVersion === 'ubuntu15' ||
                      this.state.selectedVersion === 'leap15'
                        ? tabSystemD
                        : this.state.selectedVersion == 'windowsxp' ||
                          this.state.selectedVersion == 'windowsserver2008' ||
                          this.state.selectedVersion == 'windows7'
                        ? tabNet
                        : this.state.selectedVersion == 'sierra' ||
                          this.state.selectedVersion == 'highSierra' ||
                          this.state.selectedVersion == 'mojave' ||
                          this.state.selectedVersion == 'catalina' ||
                          this.state.selectedVersion == 'bigSur' ||
                          this.state.selectedVersion == 'monterrey' ||
                          this.state.selectedVersion == 'ventura'
                        ? tabWazuhControlMacos
                        : this.state.selectedVersion == 'solaris10' ||
                          this.state.selectedVersion == 'solaris11' ||
                          this.state.selectedVersion == '6.1 TL9' ||
                          this.state.selectedVersion == '3.12.12'
                        ? tabWazuhControl
                        : this.state.selectedVersion == '11.31'
                        ? tabInitD
                        : tabSysV
                    }
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
        this.state.selectedOS !== 'amazonlinux' &&
        this.state.selectedOS !== 'fedora' &&
        this.state.selectedOS !== 'oraclelinux' &&
        this.state.selectedOS !== 'suse' &&
        this.state.selectedOS !== 'raspbian' &&
        this.state.selectedOS !== 'alpine' &&
        restartAgentCommand
          ? [
              {
                title: 'Start the agent',
                children: this.state.gotErrorRegistrationServiceInfo ? (
                  calloutErrorRegistrationServiceInfo
                ) : (
                  <EuiFlexGroup direction='column'>
                    <EuiText>
                      <div className='copy-codeblock-wrapper'>
                        <EuiCodeBlock style={codeBlock} language={language}>
                          {restartAgentCommand}
                        </EuiCodeBlock>
                        <EuiCopy textToCopy={restartAgentCommand}>
                          {copy => (
                            <div className='copy-overlay' onClick={copy}>
                              <p>
                                <EuiIcon type='copy' /> Copy command
                              </p>
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
                    <EuiSpacer />
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
  },
);
