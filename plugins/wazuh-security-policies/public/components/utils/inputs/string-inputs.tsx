import React from 'react';
import { EuiFormRow, EuiFieldText, EuiToolTip } from '@elastic/eui';
import { capitalizeFirstLetter } from '../capitalize-first-letter';

export const inputString = (
  input: { key: string; value: any },
  isEditable: boolean,
) => (
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
        value={input.value || isEditable ? '' : '-'}
        fullWidth
        compressed
        readOnly={!isEditable}
      />
    </EuiToolTip>
  </EuiFormRow>
);
