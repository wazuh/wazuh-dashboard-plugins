import React, { memo, useCallback, useEffect, useState } from 'react';
import { EuiText, EuiFieldText } from '@elastic/eui';
import _ from '@lodash';
// import { usePrevious } from '../../../../../public/components/common/hooks/use-previous';

type Props = {
  onChange: (value: string) => void;
  defaultValue?: string;
};

const WzManagerAddressInput = (props: Props) => {
  const { onChange, defaultValue } = props;
  const [value, setValue] = useState('');

  useEffect(() => {
    const prevDefaultValue = usePrevious(defaultValue);

    if (!_.isEqual(defaultValue, prevDefaultValue) && defaultValue !== '') {
      setValue(defaultValue);
      onChange(defaultValue);
    } else {
      setValue('');
      onChange('');
    }
  }, []);

  /**
   * Handles the change of the selected node IP
   * @param value
   */
  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    onChange(value);
    setValue(value);
  };
  console.log(value, 'value');
  return (
    <EuiText>
      <p>
        This is the address the agent uses to communicate with the Wazuh server.
        It can be an IP address or a fully qualified domain name (FQDN).
      </p>
      <EuiFieldText
        placeholder='Server Address'
        onChange={handleOnChange}
        value={value}
      />
    </EuiText>
  );
};

export default WzManagerAddressInput;
