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
  EuiButton,
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
import GroupInput from '../../components/group-input/group-input';
import { OsCard } from '../../components/os-selector/os-card/os-card';
import {
  validateServerAddress,
  validateAgentName,
} from '../../utils/validations';

interface IRegisterAgentProps {
  getWazuhVersion: () => Promise<string>;
  hasAgents: () => Promise<boolean>;
  addNewAgent: (agent: any) => Promise<any>;
  reload: () => void;
}

export const RegisterAgent = withReduxProvider(
  ({ getWazuhVersion, hasAgents, addNewAgent, reload }: IRegisterAgentProps) => {
    const configuration = useSelector(
      (state: { appConfig: { data: any } }) => state.appConfig.data,
    );

    const [wazuhVersion, setWazuhVersion] = useState('');
    const [haveUdpProtocol, setHaveUdpProtocol] = useState<boolean | null>(
      false,
    );
    const [haveConnectionSecure, setHaveConnectionSecure] = useState<
      boolean | null
    >(false);
    const [loading, setLoading] = useState(false);
    const [wazuhPassword, setWazuhPassword] = useState('');
    const [groups, setGroups] = useState([]);
    const [needsPassword, setNeedsPassword] = useState<boolean>(false);
    const [hideTextPassword, setHideTextPassword] = useState<boolean>(
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
      serverAddress: {
        type: 'text',
        initialValue: configuration['enrollment.dns'] || '',
        validate: validateServerAddress,
      },
      agentName: {
        type: 'text',
        initialValue: '',
        validate: validateAgentName,
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
          let hideTextPassword = false;
          await getRemoteConfig();
          const authInfo = await getAuthInfo();
          const needsPassword = (authInfo.auth || {}).use_password === 'yes';
          if (needsPassword) {
            wazuhPassword =
              configuration['enrollment.password'] ||
              authInfo['authd.pass'] ||
              '';
            if (wazuhPassword) {
              hideTextPassword = true;
            }
          }
          const groups = await getGroups();
          setNeedsPassword(needsPassword);
          setHideTextPassword(hideTextPassword);
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

    const osCard = (
      <InputForm {...form.fields.operatingSystemSelection}></InputForm>
    );

    return (
      <div>
        <EuiPage restrictWidth='1000px' style={{ background: 'transparent' }}>
          <EuiPageBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPanel className='container'>
                  <div className='close'>
                    {hasAgents() ? (
                      <EuiButtonEmpty
                        size='s'
                        onClick={() => addNewAgent(false)}
                        iconType='cross'
                      ></EuiButtonEmpty>
                    ) : (
                      <EuiButtonEmpty
                        size='s'
                        onClick={() => reload()}
                        iconType='refresh'
                      >
                        Refresh
                      </EuiButtonEmpty>
                    )}
                  </div>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiTitle>
                        <h2 className='title'>Deploy new agent</h2>
                      </EuiTitle>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer />
                  {loading ? (
                    <>
                      <EuiFlexItem>
                        <EuiProgress size='xs' color='primary' />
                      </EuiFlexItem>
                      <EuiSpacer></EuiSpacer>
                    </>
                  ) : (
                    <EuiFlexItem>
                      <Steps
                        form={form}
                        needsPassword={needsPassword}
                        hideTextPassword={hideTextPassword}
                        osCard={osCard}
                        connection={{
                          isSecure: haveConnectionSecure ? true : false,
                          isUDP: haveUdpProtocol ? true : false,
                        }}
                        wazuhPassword={wazuhPassword}
                      />
                    </EuiFlexItem>
                  )}
                  <EuiFlexGroup justifyContent="flexEnd" style={{ marginRight: '0.3rem' }}>
                    <EuiFlexItem grow={false}>
                      <EuiButton className='close-button'  onClick={() => reload()}>Close</EuiButton>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageBody>
        </EuiPage>
      </div>
    );
  },
);
