import React, { useState } from 'react';
import { EuiSteps, EuiStepStatus, EuiTitle } from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';
import { ServerAddress } from '../../components/step-two/server-addres';

export const Steps = () => {
  const [statusCheck, setStatusCheck] = useState<EuiStepStatus>('current');
  const [serverAddressStatus, setServerAddressStatus] =
    useState<EuiStepStatus>('disabled');

  const handleInputChange = (value: string) => {
    setServerAddressStatus('complete') && setServerAddressStatus('incomplete');
  };

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
          label='Etiqueta del Campo'
          value={undefined}
          setStatusCheck={setStatusCheck}
        />
      ),
      status: statusCheck,
    },
    {
      title: (
        <>
          <EuiTitle className='stepTitle'>
            <p>Server address</p>
          </EuiTitle>
        </>
      ),
      children: <ServerAddress setStatusCheck={setServerAddressStatus} />,
      status: serverAddressStatus,
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
