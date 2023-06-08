import React, { Component, Fragment, useState, useEffect } from 'react';
import {
  EuiSteps,
  EuiStepStatus,
  EuiTitle,
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';
import { ServerAddress } from '../../components/step-two/server-addres';
import WzManagerAddressInput from '../../../agent/register-agent/steps/wz-manager-address';
import { FormConfiguration } from '../../../../components/common/form/types';
import { useForm } from '../../../../components/common/form/hooks';

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

  const firstSetOfSteps = [
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Select the package to download and install on your system:</p>
        </EuiTitle>
      ),
      children: (
        <div>HOLA</div>
        // <InputForm
        //   type='custom'
        //   label='Etiqueta del Campo'
        //   value={undefined}
        //   setStatusCheck={setStatusCheck}
        //   wazuhVersion={wazuhVersion}
        //   appVersionMajorDotMinor={appVersionMajorDotMinor}
        // />
      ),
      status: statusCheck,
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
          {/* <WzManagerAddressInput
            defaultValue={defaultServerAddress}
            onChange={onChangeServerAddress}
            // isInvalid={validateInput}
          /> */}

          <InputForm
            {...form.fields.serverAddress}
            label='hola' // TODO: change label
          />
        </Fragment>
      ),
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
          {inputAgentName}
          {groupInput}
          {agentGroup}
        </Fragment>
      ),
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
