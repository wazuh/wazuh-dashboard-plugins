import React, { useState } from 'react';
import { EuiFieldText, EuiButton } from '@elastic/eui';
import { STEPS } from '../../constants';

interface ParseNameInputProps {
  step: {
    key: string;
    value: any;
    handleSetItem: (props: { key: string; newValue: any }) => void;
  };
}

export const ParseNameInput = ({ step }: ParseNameInputProps) => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <EuiFieldText
        placeholder='Enter parse name'
        value={inputValue}
        onChange={event => {
          setInputValue(event.target.value);
        }}
        compressed
      />
      <EuiButton
        size='s'
        iconType='save'
        onClick={() => {
          step.handleSetItem({
            key: `${STEPS.parse}|${inputValue}`,
            newValue: step.value,
          });
        }}
      />
    </div>
  );
};
