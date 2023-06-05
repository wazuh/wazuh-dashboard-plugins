import React, { useState } from 'react';
import { EuiSteps, EuiStepStatus, EuiTitle } from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';
import { ServerAddress } from '../../components/step-two/server-addres';

export const Steps = () => {
  const [statusCheck, setStatusCheck] = useState<EuiStepStatus>('current');
  const [serverAddressStatus, setServerAddressStatus] =
    useState<EuiStepStatus>('disabled');
  const [serverAddress, setServerAddress] = useState<string>('');
  const [udpProtocol, setUdpProtocol] = useState<boolean>(false);
  const [connectionSecure, setConnectionSecure] = useState<boolean>(true);
  const [defaultServerAddress, setDefaultServerAddress] = useState<string>('');

  const handleInputChange = (value: string) => {
    setServerAddress(value);
    setServerAddressStatus('complete');
  };

  // getEnrollDNSConfig = () => {
  //   const serverAddress = this.configuration['enrollment.dns'] || '';
  //   this.setState({ defaultServerAddress: serverAddress });
  // };

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
      children: (
        <ServerAddress
          setStatusCheck={setServerAddressStatus}
          serverAddress={serverAddress}
          udpProtocol={udpProtocol}
          connectionSecure={connectionSecure}
        />
      ),
      status: serverAddressStatus,
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
