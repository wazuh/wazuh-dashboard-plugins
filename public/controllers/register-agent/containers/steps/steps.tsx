import React, { useState } from 'react';
import { EuiSteps, EuiStepStatus, EuiTitle } from '@elastic/eui';
import { InputForm } from '../../../../components/common/form/index';
import { ServerAddress } from '../../components/step-two/server-addres';
import './steps.scss';

export const Steps = () => {
  const [statusCheck, setStatusCheck] = useState<EuiStepStatus>('current');
  const [serverAddressStatus, setServerAddressStatus] =
    useState<EuiStepStatus>('disabled');
  const [radioOptionSelected, setRadioOptionSelected] = useState<string | null>(
    null,
  );

  const handleInputChange = (value: string) => {
    setServerAddressStatus(value ? 'complete' : 'incomplete');
  };

  const handleRadioChange = (optionId: string) => {
    setRadioOptionSelected(optionId);
    setStatusCheck(optionId ? 'complete' : 'incomplete');
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
          onRadioChange={handleRadioChange}
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
        <ServerAddress
          setStatusCheck={setServerAddressStatus}
          onInputChange={handleInputChange}
        />
      ),
      status: serverAddressStatus,
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
