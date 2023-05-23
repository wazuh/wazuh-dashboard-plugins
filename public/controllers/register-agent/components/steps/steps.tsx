import React, { useState } from 'react';
import {
  EuiSpacer,
  EuiSteps,
  EuiStepStatus,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';

export const Steps = () => {
  // const handleChange = (event: ChangeEvent<any>) => {
  //   // ver
  // };
  // const [status, setStatus] = useState<EuiStepStatus>('incomplete');
  const [statusCheck, setStatusCheck] = useState<EuiStepStatus>('current');

  const firstSetOfSteps = [
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Select the package to download and install on your system:</p>
        </EuiTitle>
      ),
      children: (
        <InputForm
          type='custom'
          // onChange={handleChange}
          label='Etiqueta del Campo'
          rest={undefined}
          value={undefined}
          setStatusCheck={setStatusCheck}
        />
      ),
      status: statusCheck,
    },
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Server address</p>
        </EuiTitle>
      ),
      children: (
        <>
          <p className='stepSubtitle'>
            This is the address the agent uses to communicate with the Wazuh
            server. Enter an IP address or a fully qualified domain name (FDQN).
          </p>
        </>
      ),
      status: 'incomplete',
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
