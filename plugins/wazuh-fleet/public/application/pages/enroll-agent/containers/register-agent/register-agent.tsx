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
import { compose } from 'redux';
import './register-agent.scss';
import { Steps } from '../steps/steps';
import { InputForm } from '../../components/form';
import { useForm } from '../../components/form/hooks';
import { FormConfiguration } from '../../components/form/types';
import { OsCard } from '../../components/os-selector/os-card/os-card';
import {
  validateAgentName,
  validateEnrollmentKey,
  validateServerAddress,
} from '../../utils/validations';
import {
  getEnrollAgentManagement,
  getWazuhCore,
} from '../../../../../plugin-services';
import { version } from '../../../../../../package.json';

export const RegisterAgent = compose(
  // TODO: add HOCs
  // withErrorBoundary,
  // withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
  // withGlobalBreadcrumb([
  //   {
  //     text: endpointSummary.breadcrumbLabel,
  //     href: `#${endpointSummary.redirectTo()}`,
  //   },
  //   { text: 'Enroll new agent' },
  // ]),
  // withUserAuthorizationPrompt([
  //   [{ action: 'agent:create', resource: '*:*:*' }],
  // ]),
  // eslint-disable-next-line react/display-name
  WrappedComponent => props => <WrappedComponent {...props} />,
)(() => {
  const configuration = {}; // Use a live state (reacts to changes through some hook that provides the configuration);
  const [wazuhVersion, setWazuhVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const initialFields: FormConfiguration = {
    operatingSystemSelection: {
      type: 'custom',
      initialValue: '',
      component: props => <OsCard {...props} />,
    },
    serverAddress: {
      type: 'text',
      initialValue:
        configuration[getEnrollAgentManagement().serverAddresSettingName] || '', // TODO: use the setting value as default value
      validate: validateServerAddress,
    },
    username: {
      type: 'text',
      initialValue: '',
    },
    password: {
      type: 'password',
      initialValue: '',
    },
    verificationMode: {
      type: 'select',
      initialValue: 'none',
      options: {
        select: [
          {
            text: 'none',
            value: 'none',
          },
          {
            text: 'full',
            value: 'full',
          },
        ],
      },
    },
    agentName: {
      type: 'text',
      initialValue: '',
      validate: validateAgentName,
    },
    enrollmentKey: {
      type: 'text',
      initialValue: '',
      validate: validateEnrollmentKey,
    },
  };
  const form = useForm(initialFields);

  const getWazuhVersion = async () => {
    try {
      const result = await getWazuhCore().http.server.request('GET', '/', {});

      return result?.data?.data?.api_version;
    } catch {
      // TODO: manage error

      return version;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wazuhVersion = await getWazuhVersion();

        // get wazuh password configuration
        setWazuhVersion(wazuhVersion);
        setLoading(false);
      } catch {
        setWazuhVersion(wazuhVersion);
        setLoading(false);

        // TODO: manage error
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
                      <h1>Enroll new agent</h1>
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
                    <Steps form={form} osCard={osCard} />
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
