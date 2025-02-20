import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
} from '@elastic/eui';
import './enroll-agent.scss';
import { Steps } from '../steps/steps';
import { useForm } from '../../components/form/hooks';
import { FormConfiguration } from '../../components/form/types';
import { OsCard } from '../../components/os-selector/os-card/os-card';
import {
  validateAgentName,
  validateEnrollmentKey,
  validateServerAddress,
} from '../../utils/validations';
import { getEnrollAgentManagement } from '../../../../../plugin-services';

export const EnrollAgent = () => {
  const configuration = {}; // TODO:  Use a live state (reacts to changes through some hook that provides the configuration);
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

  return (
    <div>
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel className='enroll-agent-wizard-container'>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle size='s'>
                      <h1>Enroll new agent</h1>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer />
                <EuiFlexItem>
                  <Steps form={form} />
                </EuiFlexItem>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageBody>
      </EuiPage>
    </div>
  );
};
