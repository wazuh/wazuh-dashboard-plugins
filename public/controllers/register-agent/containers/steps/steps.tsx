import React, { Fragment, useState } from 'react';
import {
  EuiSteps,
  EuiText,
  EuiStepStatus,
  EuiTitle,
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
} from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';
import {
  REGISTER_AGENT_DATA_STEP_THREE,
  REGISTER_AGENT_DATA_STEP_TWO,
} from '../../utils/register-agent-data';

export const Steps = ({
  needsPassword,
  hidePasswordInput,
  passwordInput,
  agentGroup,
  setServerAddress,
  setUdpProtocol,
  setConnectionSecure,
  udpProtocol,
  connectionSecure,
  form,
  osCard,
  groups,
}) => {
  const validationsThirdStep = fields => {
    switch (mascota) {
      case 'lagarto':
        console.log('Tengo un lagarto');
        break;
      case 'perro':
        console.log('Tengo un perro');
        break;
      case 'gato':
        console.log('Tengo un gato');
        break;
      case 'serpiente':
        console.log('Tengo una serpiente');
        break;
      case 'loro':
        console.log('Tengo un loro');
        break;
      default:
        console.log('No tengo mascota');
        break;
    }
  };

  console.log('groups===', groups);

  const warningForAgentName =
    'The agent name must be unique. It can’t be changed once the agent has been enrolled.';
  console.log(form.fields.serverAddress, 'form.fields.serverAddress');
  console.log(form.fields.agentName.value, 'form.fields.agentName.value');
  const firstSetOfSteps = [
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Select the package to download and install on your system:</p>
        </EuiTitle>
      ),
      children: osCard,
      status: form.fields.operatingSystemSelection.value
        ? 'complete'
        : 'current',
    },
    {
      title: (
        <EuiFlexGroup>
          <EuiFlexItem className='stepTitle'>
            <p>Server address</p>
            <EuiIconTip
              content='Source maps allow browser dev tools to map minified code to the original source code'
              position='right'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
      children: (
        <Fragment>
          <EuiFlexGroup gutterSize='s' wrap>
            {REGISTER_AGENT_DATA_STEP_TWO.map((data, index) => (
              <EuiFlexItem key={index}>
                <EuiText className='stepSubtitleServerAddress'>
                  {data.subtitle}
                </EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          {/* //agregar estilos */}
          <InputForm {...form.fields.serverAddress} label={<></>} />
        </Fragment>
      ),
      status: !form.fields.operatingSystemSelection.value
        ? 'disabled'
        : !form.fields.serverAddress.value &&
          form.fields.operatingSystemSelection.value
        ? 'current'
        : form.fields.operatingSystemSelection.value &&
          form.fields.serverAddress.value
        ? 'complete'
        : '',
    },
    ...(!(!needsPassword || hidePasswordInput)
      ? [
          {
            title: (
              <EuiTitle className='stepTitle'>
                <p>Wazuh password</p>
              </EuiTitle>
            ),
            children: <Fragment>{passwordInput}</Fragment>,
          },
        ]
      : []),
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Optional settings</p>
        </EuiTitle>
      ),
      children: (
        <Fragment>
          <EuiFlexGroup gutterSize='s' wrap>
            {REGISTER_AGENT_DATA_STEP_THREE.map((data, index) => (
              <EuiFlexItem key={index}>
                <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <InputForm
            {...form.fields.agentName}
            label={
              <>
                <EuiFlexGroup>
                  <EuiFlexItem
                    style={{
                      flexDirection: 'row',
                      fontStyle: 'normal',
                      fontWeight: 700,
                      fontSize: '12px',
                      lineHeight: '20px',
                      color: '#343741',
                    }}
                  >
                    Assign an agent name{' '}
                    <EuiIconTip
                      className='iconTooltip'
                      content='Source maps allow browser dev tools to map minified code to the original source code'
                      position='right'
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </>
            }
            placeholder='Agent name'
          />
          <EuiCallOut
            color='warning'
            title={warningForAgentName}
            iconType='iInCircle'
            className='warningForAgentName'
          />
          {/* {groupInput} */}
          {agentGroup}
        </Fragment>
      ),
      status:
        !form.fields.operatingSystemSelection.value ||
        !form.fields.serverAddress.value
          ? 'disabled'
          : form.fields.serverAddress.value !== ''
          ? 'current'
          : form.fields.agentGroups.value.length > 0
          ? 'complete'
          : '',
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
