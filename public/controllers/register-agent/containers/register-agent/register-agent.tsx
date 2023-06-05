import React, { Component, Fragment, useState, useEffect } from 'react';
import { version } from '../../../../../package.json';
import { WazuhConfig } from '../../../../react-services/wazuh-config';
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
import { WzRequest } from '../../../../react-services/wz-request';
import { withErrorBoundary } from '../../../../components/common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import WzManagerAddressInput from '../../../agent/register-agent/steps/wz-manager-address';
import { getMasterRemoteConfiguration } from '../../../agent/components/register-agent-service';
import './register-agent.scss';

export const RegisterAgent = ({
  getWazuhVersion,
  hasAgents,
  addNewAgent,
  reload,
}) => {
  const wazuhConfig = new WazuhConfig();
  const configuration = wazuhConfig.getConfig();
  console.log(configuration, 'configuration');
  const addToVersion = '-1';

  const [status, setStatus] = useState('incomplete');
  const [selectedOS, setSelectedOS] = useState('');
  const [selectedSYS, setSelectedSYS] = useState('');
  const [neededSYS, setNeededSYS] = useState(false);
  const [selectedArchitecture, setselectedArchitecture] = useState('');
  const [selectedVersion, setselectedVersion] = useState('');
  const [version, setVersion] = useState('');
  const [wazuhVersion, setWazuhVersion] = useState('');
  const [serverAddress, setServerAddress] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentNameError, setAgentNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [badCharacters, setBadCharacters] = useState([]);
  const [wazuhPassword, setWazuhPassword] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [defaultServerAddress, setDefaultServerAddress] = useState('');
  const [udpProtocol, setUdpProtocol] = useState<boolean | null>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showProtocol, setShowProtocol] = useState(true);
  const [connectionSecure, setConnectionSecure] = useState<boolean | null>(
    true,
  );
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [haveUdpProtocol, setHaveUdpProtocol] = useState<boolean | null>(false);
  const [haveConnectionSecure, setHaveConnectionSecure] = useState<
    boolean | null
  >(false);
  const [gotErrorRegistrationServiceInfo, setGotErrorRegistrationServiceInfo] =
    useState<boolean | null>(false);
  const [needsPassword, setNeedsPassword] = useState<boolean | null>(false);
  const [hidePasswordInput, setHidePasswordInput] = useState<boolean | null>(
    false,
  );

  const getEnrollDNSConfig = () => {
    const serverAddress = configuration['enrollment.dns'] || '';
    console.log(serverAddress, 'serverAddress');
    setDefaultServerAddress(serverAddress);
  };

  const getRemoteConfig = async () => {
    const remoteConfig = await getMasterRemoteConfiguration();
    if (remoteConfig) {
      setHaveUdpProtocol(remoteConfig.isUdp);
      setHaveConnectionSecure(remoteConfig.haveSecureConnection);
      setUdpProtocol(remoteConfig.isUdp);
      setConnectionSecure(remoteConfig.haveSecureConnection);
    }
  };

  const getAuthInfo = async () => {
    try {
      const result = await WzRequest.apiReq(
        'GET',
        '/agents/000/config/auth/auth',
        {},
      );
      return (result.data || {}).data || {};
    } catch (error) {
      setGotErrorRegistrationServiceInfo(true);
      throw new Error(error);
    }
  };

  const getGroups = async () => {
    try {
      const result = await WzRequest.apiReq('GET', '/groups', {});
      return result.data.data.affected_items.map(item => ({
        label: item.name,
        id: item.name,
      }));
    } catch (error) {
      throw new Error(error);
    }
  };

  useEffect(() => {
    // Add inner async function
    const fetchData = async () => {
      try {
        const wazuhVersion = await getWazuhVersion();
        let wazuhPassword = '';
        let hidePasswordInput = false;
        getEnrollDNSConfig();
        await getRemoteConfig();
        const authInfo = await getAuthInfo();
        const needsPassword = (authInfo.auth || {}).use_password === 'yes';
        if (needsPassword) {
          wazuhPassword =
            configuration['enrollment.password'] ||
            authInfo['authd.pass'] ||
            '';
          if (wazuhPassword) {
            hidePasswordInput = true;
          }
        }
        const groups = await getGroups();

        setNeedsPassword(needsPassword);
        setHidePasswordInput(hidePasswordInput);
        setWazuhPassword(wazuhPassword);
        setWazuhVersion(wazuhVersion);
        setGroups(groups);
        setLoading(false);
      } catch (error) {
        setWazuhVersion(version);
        setLoading(false);

        // this.setState({
        //   wazuhVersion: version,
        //   loading: false,
        // });

        const options = {
          context: 'RegisterAgent',
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
    };

    // Call function immediately
    fetchData();
  }, []);

  // selectOS(os) {
  //   this.setState({
  //     selectedOS: os,
  //     selectedVersion: '',
  //     selectedArchitecture: '',
  //     selectedSYS: '',
  //   });
  // }

  // setServerAddress(serverAddress);

  // // setServerAddress(serverAddress) {
  // //   this.setState({ serverAddress });
  // // }

  const ValidationAgentName = event => {
    const validation = /^[a-z0-9-_.]+$/i;
    if (
      (validation.test(event.target.value) && event.target.value.length >= 2) ||
      event.target.value.length <= 0
    ) {
      setAgentName(event.target.value);
      setAgentNameError(false);
      setBadCharacters([]);

      // this.setState({
      //   agentName: event.target.value,
      //   agentNameError: false,
      //   badCharacters: [],
      // });
    } else {
      let badCharacters = event.target.value
        .split('')
        .map(char => char.replace(validation, ''))
        .join('');
      badCharacters = badCharacters
        .split('')
        .map(char => char.replace(/\s/, 'whitespace'));
      const characters = [...new Set(badCharacters)];

      setAgentName(event.target.value);
      setBadCharacters(characters);
      setAgentNameError(true);

      // this.setState({
      //   agentName: event.target.value,
      //   badCharacters: characters,
      //   agentNameError: true,
      // });
    }
  };

  const handleGroupName = selectedGroup => {
    setSelectedGroup(selectedGroup);

    // this.setState({ selectedGroup });
  };

  // setArchitecture(selectedArchitecture) {
  //   this.setState({ selectedArchitecture });
  // }

  // setVersion(selectedVersion) {
  //   this.setState({ selectedVersion, selectedArchitecture: '' });
  // }

  const handleWazuhPassword = event => {
    setWazuhPassword(event.target.value);

    // this.setState({ wazuhPassword: event.target.value });
  };

  const handlesetShowPassword = event => {
    setShowPassword(event.target.checked);

    // this.setState({ showPassword: event.target.checked });
  };

  const handleObfuscatePassword = text => {
    let obfuscate = '';
    const regex = /WAZUH_REGISTRATION_PASSWORD=?\040?\'(.*?)\'/gm;
    const match = regex.exec(text);
    const password = match[1];
    if (password) {
      [...password].forEach(() => (obfuscate += '*'));
      text = text.replace(password, obfuscate);
    }
    return text;
  };

  const optionalDeploymentVariables = () => {
    let deployment = serverAddress && `WAZUH_MANAGER='${serverAddress}' `;
    if (selectedOS == 'win') {
      deployment += `WAZUH_REGISTRATION_SERVER='${serverAddress}' `;
    }

    // if (this.state.needsPassword) {
    //   deployment += `WAZUH_REGISTRATION_PASSWORD='${this.state.wazuhPassword}' `;
    // }

    // if (this.state.udpProtocol) {
    //   deployment += "WAZUH_PROTOCOL='UDP' ";
    // }

    // if (this.state.selectedGroup.length) {
    //   deployment += `WAZUH_AGENT_GROUP='${this.state.selectedGroup
    //     .map(item => item.label)
    //     .join(',')}' `;
    // }

    // // macos doesnt need = param
    // if (this.state.selectedOS === 'macos') {
    //   return deployment.replace(/=/g, ' ');
    // }

    return deployment;
  };

  // agentNameVariable() {
  //   let agentName = `WAZUH_AGENT_NAME='${this.state.agentName}' `;
  //   if (
  //     this.state.selectedOS === 'macos' &&
  //     this.state.selectedArchitecture &&
  //     this.state.agentName !== ''
  //   ) {
  //     return agentName.replace(/=/g, ' ');
  //   }
  //   if (this.state.selectedArchitecture && this.state.agentName !== '') {
  //     return agentName;
  //   } else {
  //     return '';
  //   }
  // }

  const getHighlightCodeLanguage = selectedSO => {
    if (selectedSO.toLowerCase() === 'win') {
      return 'powershell';
    } else {
      return 'bash';
    }
  };

  const appVersionMajorDotMinor = wazuhVersion.split('.').slice(0, 2).join('.');
  const urlCheckConnectionDocumentation = webDocumentationLink(
    'user-manual/agents/agent-connection.html',
    appVersionMajorDotMinor,
  );

  const urlWazuhAgentEnrollment = webDocumentationLink(
    'user-manual/agent-enrollment/index.html',
    appVersionMajorDotMinor,
  );

  const urlWindowsPackage = `https://packages.wazuh.com/4.x/windows/wazuh-agent-${wazuhVersion}-1.msi`;
  const warningForAgentName =
    'The agent name must be unique. It can’t be changed once the agent has been enrolled.';

  const inputAgentName = (
    <EuiText>
      <p>
        The deployment sets the endpoint hostname as the agent name by default.
        Optionally, you can set the agent name below.
      </p>
      <EuiText color='default'>Assign an agent name</EuiText>
      <EuiSpacer />
      <EuiForm>
        <EuiFormRow
          isInvalid={agentNameError}
          error={[
            badCharacters.length < 1
              ? 'The minimum length is 2 characters.'
              : `The character${badCharacters.length <= 1 ? '' : 's'}
            ${badCharacters.map(char => ` "${char}"`)}
            ${badCharacters.length <= 1 ? 'is' : 'are'}
            not valid. Allowed characters are A-Z, a-z, ".", "-", "_"`,
          ]}
        >
          <EuiFieldText
            isInvalid={agentNameError}
            placeholder='Agent name'
            value={agentName}
            onChange={event => ValidationAgentName(event)}
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
      {!groups.length && (
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
        placeholder={!groups.length ? 'Default' : 'Select group'}
        options={groups}
        selectedOptions={selectedGroup}
        onChange={group => {
          handleGroupName(group);
        }}
        isDisabled={!groups.length}
        isClearable={true}
        data-test-subj='demoComboBox'
      />
    </EuiText>
  );
  const passwordInput = (
    <EuiFieldText
      placeholder='Wazuh password'
      value={wazuhPassword}
      onChange={event => handleWazuhPassword(event)}
    />
  );

  const codeBlock = {
    zIndex: '100',
  };

  const customTexts = {
    rpmText: `sudo ${optionalDeploymentVariables()}`,
  };

  const field = `${selectedOS}Text`;
  const text = customTexts[field];
  const language = getHighlightCodeLanguage(selectedOS);

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
        the package from our repository and copy it to the Windows system where
        you are going to install it. Then run the following command to perform
        the installation:
      </p>
    </>
  );

  // const windowsAdvice = this.state.selectedOS === 'win' && (
  //   <>
  //     <EuiCallOut title='Requirements' iconType='iInCircle'>
  //       <ul className='wz-callout-list'>
  //         <li>
  //           <span>
  //             You will need administrator privileges to perform this
  //             installation.
  //           </span>
  //         </li>
  //         <li>
  //           <span>PowerShell 3.0 or greater is required.</span>
  //         </li>
  //       </ul>
  //       <p>
  //         Keep in mind you need to run this command in a Windows PowerShell
  //         terminal.
  //       </p>
  //     </EuiCallOut>
  //     <EuiSpacer></EuiSpacer>
  //   </>
  // );

  const guide = (
    <div>
      {gotErrorRegistrationServiceInfo ? (
        <EuiCallOut
          color='danger'
          title='This section could not be displayed because you do not have permission to get access to the registration service.'
          iconType='iInCircle'
        />
      ) : (
        <EuiText>
          {agentName.length > 0 ? (
            <p>
              You can use this command to install and enroll the Wazuh agent.
            </p>
          ) : (
            <p>
              You can use this command to install and enroll the Wazuh agent in
              one or more hosts.
            </p>
          )}
          <EuiCallOut
            color='warning'
            title={warningUpgrade}
            iconType='iInCircle'
          />

          {!connectionSecure && (
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
                    and agents will not be able to communicate with the manager.
                  </>
                }
                iconType='iInCircle'
              />
              {/** END Warning connection NO SECURE */}
            </>
          )}
          <EuiSpacer />
          <div className='copy-codeblock-wrapper'>
            <EuiCodeBlock style={codeBlock} language={language}>
              {wazuhPassword && !showPassword
                ? handleObfuscatePassword(text)
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
          {/* {(
                  <>
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
                ) : this.state.selectedVersion == 'debian7' ? (
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
                    onChange={active => handlesetShowPassword(active)}
                  />
                ) : (
                  ''
                )} */}
          <EuiSpacer />
        </EuiText>
      )}
    </div>
  );

  const onChangeServerAddress = async nodeSelected => {
    setServerAddress(nodeSelected);
    setUdpProtocol(haveUdpProtocol);
    setConnectionSecure(haveConnectionSecure);

    // this.setState({
    //   serverAddress: nodeSelected,
    //   udpProtocol: this.state.haveUdpProtocol,
    //   connectionSecure: this.state.haveConnectionSecure,
    // });
  };

  const steps = [
    ...(!(selectedOS == 'hp')
      ? [
          {
            title: 'Wazuh server address',
            children: (
              <Fragment>
                <WzManagerAddressInput
                  defaultValue={defaultServerAddress}
                  onChange={onChangeServerAddress}
                />
              </Fragment>
            ),
          },
        ]
      : []),
    ...(!(
      !needsPassword ||
      hidePasswordInput ||
      !!['solaris10', 'solaris11', '11.31', '3.12.12'].includes(selectedVersion)
    )
      ? [
          {
            title: 'Wazuh password',
            children: <Fragment>{passwordInput}</Fragment>,
          },
        ]
      : []),
    ...(!(selectedOS == 'hp' || selectedOS == 'sol' || selectedOS == 'alpine')
      ? [
          {
            title: 'Optional settings',
            children: (
              <Fragment>
                {inputAgentName}
                {groupInput}
                {agentGroup}
              </Fragment>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className='container'>
      <div className='close'>
        {hasAgents() && (
          <EuiButtonEmpty
            size='s'
            onClick={() => addNewAgent(false)}
            iconType='cross'
          ></EuiButtonEmpty>
        )}
        {!hasAgents() && (
          <EuiButtonEmpty size='s' onClick={() => reload()} iconType='refresh'>
            Refresh
          </EuiButtonEmpty>
        )}
      </div>
      <EuiPage restrictWidth='1000px' style={{ background: 'transparent' }}>
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2 className='title'>Deploy new agent</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer />
              {loading && (
                <>
                  <EuiFlexItem>
                    <EuiProgress size='xs' color='primary' />
                  </EuiFlexItem>
                  <EuiSpacer></EuiSpacer>
                </>
              )}
              {!loading && defaultServerAddress !== '' && (
                <EuiFlexItem>
                  <EuiSteps steps={steps} />
                </EuiFlexItem>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageBody>
      </EuiPage>
    </div>
  );
};
