import React from 'react';
import { EuiFormRow, EuiFieldText, EuiToolTip } from '@elastic/eui';
import { capitalizeFirstLetter } from '../capitalize-first-letter';
import { transformInputKeyName } from '../transform-input-key-name';

export const inputString = (
  input: {
    key: string;
    value: any;
    handleSetItem: any;
    keyValue: string | undefined;
  },
  isEditable: boolean,
) => {
  const keyFinal = transformInputKeyName(input.keyValue, input.key);

  return (
    <EuiFormRow
      key={`${input.key}`}
      label={capitalizeFirstLetter(input.key)}
      fullWidth
      display='columnCompressed'
    >
      <EuiToolTip display='block' delay='long' content={input.value}>
        <EuiFieldText
          placeholder={`${capitalizeFirstLetter(input.key)} value`}
          className='eui-textTruncate'
          value={input.value}
          fullWidth
          compressed
          readOnly={!isEditable}
          onChange={event =>
            input.handleSetItem({
              newValue: event.target.value,
              key: keyFinal,
            })
          }
        />
      </EuiToolTip>
    </EuiFormRow>
  );
};
