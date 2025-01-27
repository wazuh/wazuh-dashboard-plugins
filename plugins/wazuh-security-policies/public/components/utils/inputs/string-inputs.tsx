import React from 'react';
import { EuiFormRow, EuiFieldText, EuiToolTip } from '@elastic/eui';

export const inputString = (input: { key: string; value: any }) => (
  <EuiFormRow
    key={`${input.key}`}
    label={input.key}
    fullWidth
    display='columnCompressed'
  >
    <EuiToolTip display='block' delay='long' content={input.value}>
      <EuiFieldText
        className='eui-textTruncate'
        value={input.value || '-'}
        fullWidth
        compressed
        readOnly
      />
    </EuiToolTip>
  </EuiFormRow>
);
