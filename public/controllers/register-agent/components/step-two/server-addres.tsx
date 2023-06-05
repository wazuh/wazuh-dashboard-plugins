import React, { useState } from 'react';
import { EuiText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { REGISTER_AGENT_DATA_STEP_TWO } from '../../utils/register-agent-data';
import { InputForm } from '../../../../components/common/form';
import './server-address.scss';

interface Props {
  setStatusCheck: (status: EuiStepStatus) => void;
  onChange: any;
  defaultServerAddress: string;
}

export const ServerAddress = ({
  setStatusCheck,
  onChange,
  defaultServerAddress,
}: Props) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | undefined>(undefined);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(defaultServerAddress);
  };

  const validateInput = (value: string) => {
    const regex =
      /^([a-zA-Z0-9äöüéàè-]{1,63}|([a-zA-Z0-9äöüéàè-]+\.)*[a-zA-Z0-9äöüéàè-]+)$/;
    const isLengthValid = value.length <= 255;
    const isFormatValid = regex.test(value);
    return isLengthValid && isFormatValid;
  };

  return (
    <div>
      <EuiFlexGroup gutterSize='s' wrap>
        {REGISTER_AGENT_DATA_STEP_TWO.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <div className='inputText'>
        <InputForm type='text' onChange={handleInputChange} />
      </div>
      {error && <div className='errorText'>{error}</div>}
    </div>
  );
};

// import React, { memo, useCallback, useEffect, useState } from 'react';
// import { EuiText, EuiFieldText } from '@elastic/eui';

// type Props = {
//   onChange: (value: string) => void;
//   defaultValue?: string;
// };

// const WzManagerAddressInput = (props: Props) => {
//   const { onChange, defaultValue } = props;
//   const [value, setValue] = useState('');

//   useEffect(() => {
//     if (defaultValue) {
//       setValue(defaultValue);
//       onChange(defaultValue);
//     } else {
//       setValue('');
//       onChange('');
//     }
//   }, []);
//   /**
//    * Handles the change of the selected node IP
//    * @param value
//    */
//   const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const { value } = event.target;
//     onChange(value);
//     setValue(value);
//   };
//   return (
//     <EuiText>
//       <p>
//         This is the address the agent uses to communicate with the Wazuh server.
//         It can be an IP address or a fully qualified domain name (FQDN).
//       </p>
//       <EuiFieldText
//         placeholder='Server Address'
//         onChange={handleOnChange}
//         value={value}
//       />
//     </EuiText>
//   );
// };

// export default WzManagerAddressInput;
