import React, { useState } from 'react';
import { EuiText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { REGISTER_AGENT_DATA_STEP_TWO } from '../../utils/register-agent-data';
import { InputForm } from '../../../../components/common/form';
import './server-address.scss';

interface Props {
  setStatusCheck: (status: EuiStepStatus) => void;
}

export const ServerAddress = ({ setStatusCheck }: Props) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  const handleInputChange = (value: string) => {
    setSelectedOption(value);
    setStatusCheck(value ? 'complete' : 'incomplete');
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
    </div>
  );
};
