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
  EuiToolTip,
  EuiButtonIcon,
} from '@elastic/eui';
import { WzRequest } from '../../../../../react-services/wz-request';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { ErrorHandler } from '../../../../../react-services/error-management';
import './register-agent.scss';
import { Steps } from '../steps/steps';
import { InputForm } from '../../../../common/form';
import {
  getGroups,
  getMasterConfiguration,
} from '../../services/register-agent-services';
import { useForm } from '../../../../common/form/hooks';
import { FormConfiguration } from '../../../../common/form/types';
import { useSelector } from 'react-redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withRouteResolvers,
  withUserAuthorizationPrompt,
} from '../../../../common/hocs';
import GroupInput from '../../components/group-input/group-input';
import { OsCard } from '../../components/os-selector/os-card/os-card';
import { validateAgentName } from '../../utils/validations';
import { compose } from 'redux';
import { endpointSummary } from '../../../../../utils/applications';
import { getWazuhCorePlugin } from '../../../../../kibana-services';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../../../../services/resolves';
import NavigationService from '../../../../../react-services/navigation-service';
import { SECTIONS } from '../../../../../sections';

export const RegisterAgent = compose(
  withErrorBoundary,
  withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
  withGlobalBreadcrumb([
    {
      text: endpointSummary.breadcrumbLabel,
      href: `#${endpointSummary.redirectTo()}`,
    },
    { text: 'Deploy new agent' },
  ]),
  withUserAuthorizationPrompt([
    [{ action: 'agent:create', resource: '*:*:*' }],
  ]),
)(() => {
  const configuration = useSelector(
    (state: { appConfig: { data: any } }) => state.appConfig.data,
  );
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
      validate:
        getWazuhCorePlugin().configuration._settings.get('enrollment.dns')
          .validate,
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

  const getMasterConfig = async () => {
    const masterConfig = await getMasterConfiguration();
    if (masterConfig?.remote) {
      setHaveUdpProtocol(masterConfig.remote.isUdp);
    }
    return masterConfig;
  };

  const getWazuhVersion = async () => {
    try {
      const result = await WzRequest.apiReq('GET', '/', {});
      return result?.data?.data?.api_version;
    } catch (error) {
      const options = {
        context: `RegisterAgent.getWazuhVersion`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `Could not get the Wazuh version: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
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

  const goBackEndpointSummary = () => {
    NavigationService.getInstance().navigate(`/${SECTIONS.AGENTS_PREVIEW}`);
  };

  return (
    <div>
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel className='register-agent-wizard-container'>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiFlexGroup>
                      <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
                        <EuiToolTip
                          position='right'
                          content={`Back to Endpoints`}
                        >
                          <EuiButtonIcon
                            aria-label='Back'
                            style={{ marginTop: 4 }}
                            color='primary'
                            iconSize='l'
                            iconType='arrowLeft'
                            onClick={() => goBackEndpointSummary()}
                          />
                        </EuiToolTip>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiTitle size='s'>
                          <h1>Deploy new agent</h1>
                        </EuiTitle>
                      </EuiFlexItem>
                    </EuiFlexGroup>
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
