import React, { useState } from 'react';
import { EuiText, EuiFieldText } from '@elastic/eui'

type Props = {
    onChange: (value: string) => void;
    defaultValue: string;
}

const ServerAddress = (props: Props) => {
  const { onChange, defaultValue } = props;
  const [serverAddress, setServerAddress] = useState(defaultValue || '');

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setServerAddress(e.target.value);
    onChange(e.target.value);
  }

  return (
    <EuiText>
      <p>
        This is the address the agent uses to communicate with the Wazuh server.
        It can be an IP address or a fully qualified domain name (FQDN).
      </p>
      <EuiFieldText
        placeholder='Server address'
        value={serverAddress}
        onChange={event => handleOnChange(event)}
      />
    </EuiText>
  );
}

export default ServerAddress;