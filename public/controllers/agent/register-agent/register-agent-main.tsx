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
  EuiIcon,
  EuiFieldText,
  EuiLink,
  EuiTabbedContent,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
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
  architectureButtonsOpenSuse,
  architectureButtonsAix,
  architectureButtonsHpUx,
  versionButtonAmazonLinux,
  versionButtonsRedHat,
  versionButtonsCentos,
  architectureButtonsMacos,
  osButtons,
  versionButtonsDebian,
  versionButtonsUbuntu,
  versionButtonsWindows,
  versionButtonsMacOS,
  versionButtonsOpenSuse,
  versionButtonsSolaris,
  versionButtonsAix,
  versionButtonsHPUX,
} from './config';

import {
  AgentGroup,
  InstallEnrollAgent,
  ServerAddress,
  StartAgentTabs,
  WazuhPassword,
} from './steps';
import {
  getGroups,
  getAuthInfo,
  systemSelector,
  checkMissingOSSelection,
  getCommandText,
  getHighlightCodeLanguage,
  agentNameVariable,
  systemSelectorNet,
  systemSelectorWazuhControlMacos,
  systemSelectorWazuhControl,
} from './services/register-agent-service';
import {
  OSArchitecture,
  OSSys,
  OSSystems,
  OSVersion,
  RegisterAgentState,
} from './types';
import { PermissionsAdvice } from './components';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

type Props = {
  hasAgents(): boolean;
  addNewAgent(agent: any): void;
  reload: () => void;
  getCurrentApiAddress(): string;
  getWazuhVersion(): string;
};

export const RegisterAgent = withErrorBoundary(
  class RegisterAgent extends Component<Props, RegisterAgentState> {
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
        agentName: '',
        wazuhPassword: '',
        groups: [],
        selectedGroup: [],
        udpProtocol: false,
        showPassword: false,
        loading: false,
      };
      this.restartAgentCommand = {
        rpm: systemSelector(this.state.selectedVersion),
        cent: systemSelector(this.state.selectedVersion),
        deb: systemSelector(this.state.selectedVersion),
        ubu: systemSelector(this.state.selectedVersion),
        oraclelinux: systemSelector(this.state.selectedVersion),
        macos: 'sudo /Library/Ossec/bin/wazuh-control start',
        win: 'NET START WazuhSvc',
      };
    }

    async componentDidMount() {
      try {
        this.setState({ loading: true });
        const wazuhVersion = await this.props.getWazuhVersion();
        let serverAddress = null;
        let wazuhPassword = '';
        let hidePasswordInput = false;
        serverAddress = this.configuration['enrollment.dns'] || null;
        if (!serverAddress) {
          serverAddress = await this.props.getCurrentApiAddress();
        }
        let authInfo = await getAuthInfo();
        if (!authInfo || authInfo?.error) {
          this.setState({ gotErrorRegistrationServiceInfo: true });
        }
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
        const groups = await getGroups();
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

    selectOS(os: OSSystems) {
      this.setState({
        selectedOS: os,
        selectedVersion: '',
        selectedArchitecture: '',
        selectedSYS: '',
      });
    }

    selectSYS(sys: OSSys) {
      this.setState({ selectedSYS: sys });
    }

    setServerAddress = (serverAddress: string) => {
      this.setState({ serverAddress });
    };

    setGroupName = (selectedGroup: { label: string; id: string }[]) => {
      this.setState({ selectedGroup });
    };

    setArchitecture(selectedArchitecture: OSArchitecture) {
      this.setState({ selectedArchitecture });
    }

    setVersion(selectedVersion: OSVersion) {
      this.setState({ selectedVersion, selectedArchitecture: '' });
    }

    setWazuhPassword(event: any) {
      this.setState({ wazuhPassword: event.target.value });
    }

    setAgentName(event: any) {
      this.setState({ agentName: event.target.value });
    }

    setShowPassword(event: any) {
      this.setState({ showPassword: event.target.checked });
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
      const textAndLinkToCheckConnectionDocumentation = (
        <p>
          To verify the connection with the Wazuh server, please follow this{' '}
          <a href={urlCheckConnectionDocumentation} target='_blank'>
            document.
          </a>
        </p>
      );
      const missingOSSelection = checkMissingOSSelection(
        this.state.selectedOS,
        this.state.selectedVersion,
        this.state.selectedArchitecture,
      );
      const language = getHighlightCodeLanguage(this.state.selectedOS);

      const Commandtext = getCommandText({
        ...this.state,
        agentName: agentNameVariable(
          this.state.agentName,
          this.state.selectedArchitecture,
        ),
      });
      const restartAgentCommand = this.restartAgentCommand[
        this.state.selectedOS
      ];
      const onTabClick = (selectedTab: { label: string; id: string }) => {
        this.selectSYS(selectedTab.id as OSSys);
      };

      const calloutErrorRegistrationServiceInfo = this.state
        .gotErrorRegistrationServiceInfo ? (
        <PermissionsAdvice />
      ) : null;

      const agentName = (
        <EuiFieldText
          placeholder='Name agent'
          value={this.state.agentName}
          onChange={event => this.setAgentName(event)}
        />
      );

      const buttonGroup = (legend, options, idSelected, onChange) => {
        return (
          <EuiButtonGroup
            color='primary'
            legend={legend}
            options={options}
            idSelected={idSelected}
            onChange={onChange}
            className={'osButtonsStyle'}
          />
        );
      };

      const buttonGroupWithMessage = (
        legend,
        options,
        idSelected,
        onChange,
      ) => {
        return (
          <>
            <EuiButtonGroup
              color='primary'
              legend={legend}
              options={options}
              idSelected={idSelected}
              onChange={onChange}
              className={'osButtonsStyle'}
            />
            {this.state.selectedVersion == 'solaris10' ||
            this.state.selectedVersion == 'solaris11' ? (
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
            ) : this.state.selectedVersion == '6.1 TL9' ? (
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
            ) : this.state.selectedVersion == '11.31' ? (
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
            ) : this.state.selectedVersion == 'debian7' ||
              this.state.selectedVersion == 'debian8' ||
              this.state.selectedVersion == 'debian9' ||
              this.state.selectedVersion == 'debian10' ? (
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
            ) : (
              ''
            )}
          </>
        );
      };

      const selectedVersionMac = (legend, options, idSelected, onChange) => {
        return (
          <EuiButtonGroup
            color='primary'
            legend={legend}
            options={options}
            idSelected={idSelected}
            onChange={onChange}
            className={'osButtonsStyleMac'}
          />
        );
      };

      const tabSysV = [
        {
          id: 'sysV',
          name: 'SysV Init',
          content: (
            <Fragment>
              <EuiSpacer />
              <EuiText>
                <div className='copy-codeblock-wrapper'>
                  <EuiCodeBlock language={language}>
                    {systemSelector(this.state.selectedVersion)}
                  </EuiCodeBlock>
                  <EuiCopy
                    textToCopy={systemSelector(this.state.selectedVersion) || ''}
                  >
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
                  <EuiCodeBlock language={language}>
                    {systemSelector(this.state.selectedVersion)}
                  </EuiCodeBlock>
                  <EuiCopy
                    textToCopy={
                      systemSelector(this.state.selectedVersion) || ''
                    }
                  >
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
                  <EuiCodeBlock language={language}>
                    {systemSelectorNet(this.state.selectedVersion)}
                  </EuiCodeBlock>
                  <EuiCopy
                    textToCopy={
                      systemSelectorNet(this.state.selectedVersion) || ''
                    }
                  >
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
                  <EuiCodeBlock language={language}>
                    {systemSelectorWazuhControlMacos(
                      this.state.selectedVersion,
                    )}
                  </EuiCodeBlock>
                  <EuiCopy
                    textToCopy={
                      systemSelectorWazuhControlMacos(
                        this.state.selectedVersion,
                      ) || ''
                    }
                  >
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
                  <EuiCodeBlock language={language}>
                    {systemSelectorWazuhControl(this.state.selectedVersion)}
                  </EuiCodeBlock>
                  <EuiCopy
                    textToCopy={
                      systemSelectorWazuhControl(this.state.selectedVersion) ||
                      ''
                    }
                  >
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

      const steps = [
        {
          title: 'Choose the operating system',
          children: buttonGroup(
            'Choose the Operating system',
            osButtons,
            this.state.selectedOS,
            os => this.selectOS(os),
          ),
        },
        ...(this.state.selectedOS == 'rpm'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == 'redhat5' ||
                  this.state.selectedVersion == 'redhat6'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsRedHat,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsRedHat,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'oraclelinux'
          ? [
              {
                title: 'Choose the version',
                children: buttonGroup(
                  'Choose the version',
                  versionButtonsOracleLinux,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'raspbian'
          ? [
              {
                title: 'Choose the version',
                children: buttonGroup(
                  'Choose the version',
                  versionButtonsRaspbian,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'amazonlinux'
          ? [
              {
                title: 'Choose the version',
                children: buttonGroup(
                  'Choose the version',
                  versionButtonAmazonLinux,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'cent'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == 'centos5' ||
                  this.state.selectedVersion == 'centos6'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsCentos,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsCentos,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'fedora'
          ? [
              {
                title: 'Choose the version',
                children: buttonGroup(
                  'Choose the version',
                  versionButtonFedora,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'deb'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == 'debian7' ||
                  this.state.selectedVersion == 'debian8' ||
                  this.state.selectedVersion == 'debian9' ||
                  this.state.selectedVersion == 'debian10'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsDebian,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsDebian,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'ubu'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == 'ubuntu14'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsUbuntu,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsUbuntu,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'win'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == 'windowsxp'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsWindows,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsWindows,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'macos'
          ? [
              {
                title: 'Choose the version',
                children: selectedVersionMac(
                  'Choose the version',
                  versionButtonsMacOS,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'suse'
          ? [
              {
                title: 'Choose the version',
                children: selectedVersionMac(
                  'Choose the version',
                  versionButtonsSuse,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'open'
          ? [
              {
                title: 'Choose the version',
                children: buttonGroup(
                  'Choose the version',
                  versionButtonsOpenSuse,
                  this.state.selectedVersion,
                  version => this.setVersion(version),
                ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'sol'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == 'solaris10' ||
                  this.state.selectedVersion == 'solaris11'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsSolaris,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsSolaris,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'aix'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == '6.1 TL9'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsAix,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsAix,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      ),
              },
            ]
          : []),
        ...(this.state.selectedOS == 'hp'
          ? [
              {
                title: 'Choose the version',
                children:
                  this.state.selectedVersion == '11.31'
                    ? buttonGroupWithMessage(
                        'Choose the version',
                        versionButtonsHPUX,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
                      )
                    : buttonGroup(
                        'Choose the version',
                        versionButtonsHPUX,
                        this.state.selectedVersion,
                        version => this.setVersion(version),
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
                children: buttonGroup(
                  'Choose the architecture',
                  architecturei386Andx86_64,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'leap15'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsOpenSuse,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'centos6' ||
        this.state.selectedVersion == 'oraclelinux6' ||
        this.state.selectedVersion == 'amazonlinux1' ||
        this.state.selectedVersion == 'redhat6' ||
        this.state.selectedVersion == 'redhat7' ||
        this.state.selectedVersion == 'amazonlinux2022' ||
        this.state.selectedVersion == 'debian7' ||
        this.state.selectedVersion == 'debian8' ||
        this.state.selectedVersion == 'ubuntu14' ||
        this.state.selectedVersion == 'ubuntu15' ||
        this.state.selectedVersion == 'ubuntu16'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtons,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'centos7' ||
        this.state.selectedVersion == 'amazonlinux2' ||
        this.state.selectedVersion == 'suse12' ||
        this.state.selectedVersion == '22' ||
        this.state.selectedVersion == 'debian9' ||
        this.state.selectedVersion == 'debian10' ||
        this.state.selectedVersion == 'busterorgreater'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsWithPPC64LE,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'windowsxp' ||
        this.state.selectedVersion == 'windows8'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsi386,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'sierra' ||
        this.state.selectedVersion == 'highSierra' ||
        this.state.selectedVersion == 'mojave' ||
        this.state.selectedVersion == 'catalina' ||
        this.state.selectedVersion == 'bigSur' ||
        this.state.selectedVersion == 'monterrey'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsMacos,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == 'solaris10' ||
        this.state.selectedVersion == 'solaris11'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsSolaris,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == '6.1 TL9'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsAix,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        ...(this.state.selectedVersion == '11.31'
          ? [
              {
                title: 'Choose the architecture',
                children: buttonGroup(
                  'Choose the architecture',
                  architectureButtonsHpUx,
                  this.state.selectedArchitecture,
                  architecture => this.setArchitecture(architecture),
                ),
              },
            ]
          : []),
        {
          title: 'Wazuh server address',
          children: (
            <Fragment>
              <ServerAddress
                defaultValue={this.state.serverAddress}
                onChange={this.setServerAddress}
              />
            </Fragment>
          ),
        },
        ...(!(!this.state.needsPassword || this.state.hidePasswordInput)
          ? [
              {
                title: 'Wazuh password',
                children: (
                  <Fragment>
                    <WazuhPassword
                      defaultValue={this.state.wazuhPassword}
                      onChange={(value: string) => this.setWazuhPassword(value)}
                    />
                  </Fragment>
                ),
              },
            ]
          : []),
        {
          title: 'Assign a name and a group to the agent',
          children: (
            <Fragment>
              {agentName}
              <AgentGroup
                options={this.state.groups}
                onChange={(value: any) => this.setGroupName(value)}
              />
            </Fragment>
          ),
        },
        {
          title: 'Install and enroll the agent',
          children: this.state.gotErrorRegistrationServiceInfo ? (
            calloutErrorRegistrationServiceInfo
          ) : missingOSSelection.length ? (
            <EuiCallOut
              color='warning'
              title={`Please select the ${missingOSSelection.join(', ')}.`}
              iconType='iInCircle'
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
        this.state.selectedOS == 'hp'
          ? [
              {
                title: 'Start the agent',
                children: this.state.gotErrorRegistrationServiceInfo ? (
                  calloutErrorRegistrationServiceInfo
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
                      this.state.selectedVersion == 'oraclelinux5' ||
                      this.state.selectedVersion == 'amazonlinux2' ||
                      this.state.selectedVersion == '22' ||
                      this.state.selectedVersion == 'debian8' ||
                      this.state.selectedVersion == 'debian10' ||
                      this.state.selectedVersion == 'busterorgreater' ||
                      this.state.selectedVersion === 'ubuntu15' ||
                      this.state.selectedVersion === 'ubuntu16' ||
                      this.state.selectedVersion === 'leap15'
                        ? tabSystemD
                        : this.state.selectedVersion == 'windowsxp' ||
                          this.state.selectedVersion == 'windows8'
                        ? tabNet
                        : this.state.selectedVersion == 'sierra' ||
                          this.state.selectedVersion == 'highSierra' ||
                          this.state.selectedVersion == 'mojave' ||
                          this.state.selectedVersion == 'catalina' ||
                          this.state.selectedVersion == 'bigSur' ||
                          this.state.selectedVersion == 'monterrey'
                        ? tabWazuhControlMacos
                        : this.state.selectedVersion == 'solaris10' ||
                          this.state.selectedVersion == 'solaris11' ||
                          this.state.selectedVersion == '6.1 TL9' ||
                          this.state.selectedVersion == '11.31'
                        ? tabWazuhControl
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
                        <EuiCodeBlock language={language}>
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
                    <EuiSpacer></EuiSpacer>
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
