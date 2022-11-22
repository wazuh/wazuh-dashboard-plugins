import React, { useState } from 'react';
import { EuiFieldText } from '@elastic/eui';

export default function WazuhPassword(props: any) {
  const { defaultValue, onChange } = props;
  const [wazuhPassword, setWazuhPassword] = useState(defaultValue || '');

  const onHandleChange = (e: any) => {
    setWazuhPassword(e.target.value);
    onChange(e.target.value);
  }

  return (
    <EuiFieldText
      placeholder='Wazuh password'
      value={wazuhPassword}
      onChange={onHandleChange}
    />
  );
}
