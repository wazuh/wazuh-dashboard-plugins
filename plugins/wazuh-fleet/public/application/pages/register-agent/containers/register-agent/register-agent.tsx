import React, { useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiProgress,
} from '@elastic/eui';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
// import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
// import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
// import { ErrorHandler } from '../../../../../react-services/error-management';
import './register-agent.scss';
import { Steps } from '../steps/steps';
import { InputForm } from '../../components/form';
import {
  getGroups,
  getMasterConfiguration,
} from '../../services/register-agent-services';
import { useForm } from '../../components/form/hooks';
import { FormConfiguration } from '../../components/form/types';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withRouteResolvers,
  withUserAuthorizationPrompt,
} from '../../../../common/hocs';
import GroupInput from '../../components/group-input/group-input';
import { OsCard } from '../../components/os-selector/os-card/os-card';
import { validateAgentName } from '../../utils/validations';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../../../../services/resolves';
import { getWazuhCore } from '../../../../../plugin-services';

export const RegisterAgent = compose(
  // TODO: add HOCs
  // withErrorBoundary,
  // withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
  // withGlobalBreadcrumb([
  //   {
  //     text: endpointSummary.breadcrumbLabel,
  //     href: `#${endpointSummary.redirectTo()}`,
  //   },
  //   { text: 'Deploy new agent' },
  // ]),
  // withUserAuthorizationPrompt([
  //   [{ action: 'agent:create', resource: '*:*:*' }],
  // ]),
  WrappedComponent => props => <WrappedComponent {...props} />,
)(() => {
  const configuration = {}; // Use a live state (reacts to changes through some hook that provides the configuration);
  const [wazuhVersion, setWazuhVersion] = useState('');
  const [haveUdpProtocol, setHaveUdpProtocol] = useState<boolean | null>(false);
  const [loading, setLoading] = useState(false);
  const [wazuhPassword, setWazuhPassword] = useState('');
  const [groups, setGroups] = useState([]);
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const initialFields: FormConfiguration = {
    operatingSystemSelection: {
      type: 'custom',
      initialValue: '',
      component: props => <OsCard {...props} />,
      options: {
        groups,
      },
    },
    serverAddress: {
      type: 'text',
      initialValue: configuration['enrollment.dns'] || '',
      // validate:
      //   getWazuhCore().configuration._settings.get('enrollment.dns').validate,
    },
    agentName: {
      type: 'text',
      initialValue: '',
      validate: validateAgentName,
    },

    agentGroups: {
      type: 'custom',
      initialValue: [],
      component: props => <GroupInput {...props} />,
      options: {
        groups,
      },
    },
  };
  const form = useForm(initialFields);

  const getMasterConfig = async () => {
    const masterConfig = await getMasterConfiguration();

    if (masterConfig?.remote) {
      setHaveUdpProtocol(masterConfig.remote.isUdp);
    }

    return masterConfig;
  };

  const getWazuhVersion = async () => {
    try {
      const result = await getWazuhCore().http.server.request('GET', '/', {});

      return result?.data?.data?.api_version;
    } catch {
      // TODO: manage error
      // const options = {
      //   context: `RegisterAgent.getWazuhVersion`,
      //   level: UI_LOGGER_LEVELS.ERROR,
      //   severity: UI_ERROR_SEVERITIES.BUSINESS,
      //   error: {
      //     error: error,
      //     message: error.message || error,
      //     title: `Could not get the Wazuh version: ${error.message || error}`,
      //   },
      // };

      // getErrorOrchestrator().handleError(options);

      return version;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wazuhVersion = await getWazuhVersion();
        const { auth: authConfig } = await getMasterConfig();
        // get wazuh password configuration
        let wazuhPassword = '';
        const needsPassword = authConfig?.auth?.use_password === 'yes';

        if (needsPassword) {
          wazuhPassword =
            configuration?.['enrollment.password'] ||
            authConfig?.['authd.pass'] ||
            '';
        }

        const groups = await getGroups();

        setNeedsPassword(needsPassword);
        setWazuhPassword(wazuhPassword);
        setWazuhVersion(wazuhVersion);
        setGroups(groups);
        setLoading(false);
      } catch {
        setWazuhVersion(wazuhVersion);
        setLoading(false);

        // TODO: manage error
        // const options = {
        //   context: 'RegisterAgent',
        //   level: UI_LOGGER_LEVELS.ERROR,
        //   severity: UI_ERROR_SEVERITIES.BUSINESS,
        //   display: true,
        //   store: false,
        //   error: {
        //     error: error,
        //     message: error.message || error,
        //     title: error.name || error,
        //   },
        // };

        // ErrorHandler.handleError(error, options);
      }
    };

    fetchData();
  }, []);

  const osCard = (
    <InputForm {...form.fields.operatingSystemSelection}></InputForm>
  );

  return (
    <div>
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel className='register-agent-wizard-container'>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle size='s'>
                      <h1>Deploy new agent</h1>
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
                      wazuhPassword={wazuhPassword}
                      osCard={osCard}
                      connection={{
                        isUDP: haveUdpProtocol ? true : false,
                      }}
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
});
