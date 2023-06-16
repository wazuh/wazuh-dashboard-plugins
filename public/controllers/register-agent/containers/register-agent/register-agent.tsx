import React, { useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiButtonEmpty,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiProgress,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { ErrorHandler } from '../../../../react-services/error-management';
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
    const configuration = useSelector(
      (state: { appConfig: { data: any } }) => state.appConfig.data,
    );

    const [wazuhVersion, setWazuhVersion] = useState('');
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
    const [loading, setLoading] = useState(false);
    const [wazuhPassword, setWazuhPassword] = useState('');
    const [groups, setGroups] = useState([]);
    const [needsPassword, setNeedsPassword] = useState<boolean | null>(false);
    const [hidePasswordInput, setHidePasswordInput] = useState<boolean | null>(
      false,
    );

    const initialFields: FormConfiguration = {
      operatingSystemSelection: {
        type: 'custom',
        initialValue: '',
        component: props => {
          return <OsCard {...props} />;
        },
        options: {
          groups,
        },
      },

      //IP: This is a set of four numbers, for example, 192.158.1.38. Each number in the set can range from 0 to 255. Therefore, the full range of IP addresses goes from 0.0.0.0 to 255.255.255.255.

      //FQDN: Maximum of 63 characters per label.
      // Can only contain numbers, letters and hyphens (-)
      // Cannot begin or end with a hyphen
      // Currently supports multilingual characters, i.e. letters not included in the English alphabet: e.g. á é í ó ú ü ñ.

      serverAddress: {
        type: 'text',
        initialValue: configuration['enrollment.dns'] || '',
        validate: value => {
          const isFQDN =
            /^(?!.{256})(([a-zA-Z0-9áéíóúüñ]|[a-zA-Z0-9áéíóúüñ][a-zA-Z0-9-]*[a-zA-Z0-9áéíóúüñ])\.){1,126}([a-zA-Záéíóúüñ]{2,63}|[a-zA-Z0-9-áéíóúüñ]{2,63}\.[a-zA-Záéíóúüñ]{2,63})$/;
          const isIP =
            /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4})$/;
          const numbersAndPoints = /^[0-9.]+$/;
          const isMaxLengthValid = value.length <= 63;
          const isMinLengthValid = value.length >= 2;
          const isFQDNFormatValid = isFQDN.test(value);
          const isIPFormatValid = isIP.test(value);
          const areNumbersAndPoints = numbersAndPoints.test(value);
          let validation = undefined;
          if (value.length === 0) {
            return validation;
          } else if (
            isFQDNFormatValid &&
            isMaxLengthValid &&
            isMinLengthValid &&
            value !== 0
          ) {
            return validation; // FQDN valid
          } else if (
            isIPFormatValid &&
            isMaxLengthValid &&
            isMinLengthValid &&
            value !== 0
          ) {
            return validation; // IP valid
          } else if (!areNumbersAndPoints && !isFQDNFormatValid) {
            return (validation =
              'Each label must have a letter or number at the beginning. The maximum lenght is 63 characters.'); // FQDN invalid
          } else if (areNumbersAndPoints && !isIPFormatValid) {
            return (validation = 'Not a valid IP'); // IP invalid
          }
        },
      },

      agentName: {
        type: 'text',
        initialValue: '',
        validate: value => {
          if (value.length === 0) {
            return undefined;
          }
          const regex = /^[A-Za-z.\-_,]+$/;

          const isLengthValid = value.length >= 2 && value.length <= 63;
          const isFormatValid = regex.test(value);
          if (!isFormatValid && !isLengthValid) {
            return 'The minimum length is 2 characters. The character is not valid. Allowed characters are A-Z, a-z, ".", "-", "_"';
          } else if (!isLengthValid) {
            return 'The minimum length is 2 characters.';
          } else if (!isFormatValid) {
            return 'The character is not valid. Allowed characters are A-Z, a-z, ".", "-", "_"';
          }
          return '';
        },
      },

      agentGroups: {
        type: 'custom',
        initialValue: [],
        component: props => {
          return <GroupInput {...props} />;
        },
        options: {
          groups,
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
        ErrorHandler.handleError(error);
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
          setWazuhVersion(wazuhVersion);
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
          ErrorHandler.handleError(error, options);
        }
      };

      fetchData();
    }, []);

    const agentGroup = <InputForm {...form.fields.agentGroups}></InputForm>;
    const osCard = (
      <InputForm {...form.fields.operatingSystemSelection}></InputForm>
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
                      <Steps
                        form={form}
                        needsPassword={needsPassword}
                        hidePasswordInput={hidePasswordInput}
                        agentGroup={agentGroup}
                        osCard={osCard}
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
