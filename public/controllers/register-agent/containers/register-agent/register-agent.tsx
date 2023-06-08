import React, { Component, Fragment, useState, useEffect } from 'react';
import { version } from '../../../../../package.json';
import { WazuhConfig } from '../../../../react-services/wazuh-config';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiComboBox,
  EuiFieldText,
  EuiText,
  EuiTitle,
  EuiButtonEmpty,
  EuiPage,
  EuiPageBody,
  EuiCallOut,
  EuiSpacer,
  EuiProgress,
  EuiFormRow,
  EuiForm,
  EuiIconTip,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import WzManagerAddressInput from '../../../agent/register-agent/steps/wz-manager-address';
import { getMasterRemoteConfiguration } from '../../../agent/components/register-agent-service';
import './register-agent.scss';
import { Steps } from '../steps/steps';
import { InputForm } from '../../../../components/common/form';
import { getGroups } from '../../services/register-agent-services';
import { useForm } from '../../../../components/common/form/hooks';
import { FormConfiguration } from '../../../../components/common/form/types';
import { useSelector } from 'react-redux';
import { withReduxProvider } from '../../../../components/common/hocs';
import GroupInput from '../../components/steps-three/group-input';
import { OsCard } from '../../components/step-one/os-card/os-card';

export const RegisterAgent = withReduxProvider(
  ({ getWazuhVersion, hasAgents, addNewAgent, reload }) => {
    // const wazuhConfig = new WazuhConfig();
    // const configuration = wazuhConfig.getConfig();
    const configuration = useSelector(state => state.appConfig.data);
    console.log(configuration, 'configuration');

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
    const [udpProtocol, setUdpProtocol] = useState<boolean | null>(false);
    const [connectionSecure, setConnectionSecure] = useState<boolean | null>(
      true,
    );
    const [haveUdpProtocol, setHaveUdpProtocol] = useState<boolean | null>(
      false,
    );
    const [haveConnectionSecure, setHaveConnectionSecure] = useState<
      boolean | null
    >(false);
    const [
      gotErrorRegistrationServiceInfo,
      setGotErrorRegistrationServiceInfo,
    ] = useState<boolean | null>(false);
    const [needsPassword, setNeedsPassword] = useState<boolean | null>(false);
    const [hidePasswordInput, setHidePasswordInput] = useState<boolean | null>(
      false,
    );
    const [statusCheck, setStatusCheck] = useState<EuiStepStatus>('current');
    const [serverAddressStatus, setServerAddressStatus] =
      useState<EuiStepStatus>('disabled');

    const initialFields: FormConfiguration = {
      osCards: {
        type: 'custom',
        initialValue: [],
        component: props => {
          return (
            <OsCard
              setStatusCheck={setStatusCheck}
              appVersionMajorDotMinor={appVersionMajorDotMinor}
            />
          );
        },
        options: {
          groups: groups,
        },
      },

      serverAddress: {
        type: 'text',
        initialValue: configuration['enrollment.dns'] || '',
        validate: value => {
          const regex =
            /^([a-zA-Z0-9äöüéàè-]{1,63}|([a-zA-Z0-9äöüéàè-]+\.)*[a-zA-Z0-9äöüéàè-]+)$/;
          const isLengthValid = value.length <= 255;
          const isFormatValid = regex.test(value);
          return isLengthValid && isFormatValid
            ? undefined
            : 'There is an error'; // TODO: change error validation message
        },
      },

      agentName: {
        type: 'text',
        initialValue: configuration['enrollment.dns'] || '',
        validate: value => {
          const regex =
            /^([a-zA-Z0-9äöüéàè-]{1,63}|([a-zA-Z0-9äöüéàè-]+\.)*[a-zA-Z0-9äöüéàè-]+)$/;
          const isLengthValid = value.length <= 255;
          const isFormatValid = regex.test(value);
          return isLengthValid && isFormatValid
            ? undefined
            : 'There is an error'; // TODO: change error validation message
        },
      },

      agentGroups: {
        type: 'custom',
        initialValue: [],
        component: props => {
          return <GroupInput {...props} />;
        },
        options: {
          groups: groups,
        },
      },
    };

    const form = useForm(initialFields);

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

    useEffect(() => {
      const fetchData = async () => {
        try {
          const wazuhVersion = await getWazuhVersion();
          let wazuhPassword = '';
          let hidePasswordInput = false;
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

      fetchData();
    }, []);

    const ValidationAgentName = event => {
      const validation = /^[a-z0-9-_.]+$/i;
      if (
        (validation.test(event.target.value) &&
          event.target.value.length >= 2) ||
        event.target.value.length <= 0
      ) {
        setAgentName(event.target.value);
        setAgentNameError(false);
        setBadCharacters([]);
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
      }
    };

    const handleGroupName = selectedGroup => {
      setSelectedGroup(selectedGroup);
    };

    const handleWazuhPassword = event => {
      setWazuhPassword(event.target.value);
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

    const appVersionMajorDotMinor = wazuhVersion
      .split('.')
      .slice(0, 2)
      .join('.');

    const warningForAgentName =
      'The agent name must be unique. It can’t be changed once the agent has been enrolled.';

    const inputAgentName = (
      <EuiText>
        <p>
          The deployment sets the endpoint hostname as the agent name by
          default. Optionally, you can set the agent name below.
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
            <InputForm
              type='text'
              label='Etiqueta del Campo'
              // placeholder='Agent name'
              // isInvalid={agentNameError}
              value={agentName}
              onChange={event => ValidationAgentName(event)}
              // setStatusCheck={setStatusCheck}
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

    // const agentGroup = (
    //   <EuiText style={{ marginTop: '1.5rem' }}>
    //     <p>Select one or more existing groups</p>
    //     <EuiComboBox
    //       placeholder={
    //         !form.fields.agentGroups.value.length ? 'Default' : 'Select group'
    //       }
    //       options={groups}
    //       selectedOptions={form.fields.agentGroups.value}
    //       onChange={group => {
    //         form.fields.agentGroups.onChange({
    //           target: { value: group },
    //         }); // TODO: should not need the event.target.value
    //         // handleGroupName(group);
    //       }}
    //       isDisabled={!groups.length}
    //       isClearable={true}
    //       data-test-subj='demoComboBox'
    //     />
    //   </EuiText>
    // );

    const agentGroup = <InputForm {...form.fields.agentGroups}></InputForm>;
    const osCard = <InputForm {...form.fields.osCards}></InputForm>;

    const passwordInput = (
      <EuiFieldText
        placeholder='Wazuh password'
        value={wazuhPassword}
        onChange={event => handleWazuhPassword(event)}
      />
    );

    return (
      <div>
        <div className='close'>
          {hasAgents() && (
            <EuiButtonEmpty
              size='s'
              onClick={() => addNewAgent(false)}
              iconType='cross'
            ></EuiButtonEmpty>
          )}
          {!hasAgents() && (
            <EuiButtonEmpty
              size='s'
              onClick={() => reload()}
              iconType='refresh'
            >
              Refresh
            </EuiButtonEmpty>
          )}
        </div>
        <EuiPage restrictWidth='1000px' style={{ background: 'transparent' }}>
          <EuiPageBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPanel className='container'>
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
                  {!loading && (
                    <EuiFlexItem>
                      {/* <EuiSteps steps={steps} /> */}
                      <Steps
                        form={form}
                        needsPassword={needsPassword}
                        hidePasswordInput={hidePasswordInput}
                        passwordInput={passwordInput}
                        inputAgentName={inputAgentName}
                        groupInput={groupInput}
                        agentGroup={agentGroup}
                        osCard={osCard}
                        wazuhVersion={wazuhVersion}
                        appVersionMajorDotMinor={appVersionMajorDotMinor}
                        serverAddress={serverAddress}
                        setServerAddress={setServerAddress}
                        setUdpProtocol={setUdpProtocol}
                        setConnectionSecure={setConnectionSecure}
                        udpProtocol={udpProtocol}
                        connectionSecure={connectionSecure}
                      />
                    </EuiFlexItem>
                  )}
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageBody>
        </EuiPage>
      </div>
    );
  },
);
