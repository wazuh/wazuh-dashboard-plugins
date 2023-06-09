import React, { Component, Fragment, useState, useEffect } from 'react';
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
import { ServerAddress } from '../../components/step-two/server-addres';
import WzManagerAddressInput from '../../../agent/register-agent/steps/wz-manager-address';
import { FormConfiguration } from '../../../../components/common/form/types';
import { useForm } from '../../../../components/common/form/hooks';
import {
  REGISTER_AGENT_DATA_STEP_THREE,
  REGISTER_AGENT_DATA_STEP_TWO,
} from '../../utils/register-agent-data';

export const Steps = ({
  steps,
  needsPassword,
  hidePasswordInput,
  passwordInput,
  inputAgentName,
  groupInput,
  agentGroup,
  defaultServerAddress,
  wazuhVersion,
  appVersionMajorDotMinor,
  serverAddress,
  setServerAddress,
  setUdpProtocol,
  setConnectionSecure,
  udpProtocol,
  connectionSecure,
  form,
  osCard,
  agentName,
}) => {
  const [statusCheck, setStatusCheck] = useState<EuiStepStatus>('current');
  const [serverAddressStatus, setServerAddressStatus] =
    useState<EuiStepStatus>('disabled');

  const handleInputChange = (value: string) => {
    setServerAddress(value);
    setServerAddressStatus('complete');
  };

  const onChangeServerAddress = async (nodeSelected: any) => {
    setServerAddress(nodeSelected);
    setUdpProtocol(udpProtocol);
    setConnectionSecure(connectionSecure);
  };

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
      // <InputForm
      //   type='custom'
      //   label='Etiqueta del Campo'
      //   value={undefined}
      //   setStatusCheck={setStatusCheck}
      //   wazuhVersion={wazuhVersion}
      //   appVersionMajorDotMinor={appVersionMajorDotMinor}
      // />
      status: form.fields.operatingSystemSelection.value
        ? 'complete'
        : 'current',
    },
    {
      title: (
        // <EuiFlexGroup>
        //   <EuiFlexItem>
        <EuiTitle className='stepTitle'>
          <p>Server address</p>
        </EuiTitle>
        //   </EuiFlexItem>
        //   <EuiFlexItem>
        //     <EuiIconTip
        //       content='Source maps allow browser dev tools to map minified code to the original source code'
        //       position='right'
        //     />
        //   </EuiFlexItem>
        // </EuiFlexGroup>
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
            label='Assign an agent name'
            placeholder='Agent name'
          />
          <EuiCallOut
            color='warning'
            title={warningForAgentName}
            iconType='iInCircle'
            className='warningForAgentName'
          />
          {groupInput}
          {agentGroup}
        </Fragment>
      ),
      status: !form.fields.operatingSystemSelection.value
        ? 'disabled'
        : !form.fields.serverAddress.value
        ? 'disabled'
        : form.fields.serverAddress.value
        ? 'current'
        : form.fields.agentName.value
        ? 'complete'
        : '',
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
