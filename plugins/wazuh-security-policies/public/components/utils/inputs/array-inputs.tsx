import React from 'react';
import { EuiBasicTable, EuiFormRow, EuiComboBox } from '@elastic/eui';
import { inputString } from './string-inputs';

export const inputArray = (input: { key: string; value: any }) => {
  const renderArrayTable = ['check', 'parse|', 'normalize'];
  const isArrayOfObjects =
    Array.isArray(input.value) &&
    input.value.length > 0 &&
    !Array.isArray(input.value[0]) &&
    typeof input.value[0] === 'object';
  const inputs = input.value.map((item: any) => {
    if (!Number.isNaN(Number.parseInt(input.key))) {
      return item;
    }

    if (typeof item === 'string') {
      return {
        label: Array.isArray(item) ? item.join(', ') : item,
        value: Array.isArray(item) ? item.join(', ') : item,
      };
    }

    return {
      key: Object.keys(item)[0],
      value: Array.isArray(Object.values(item)[0])
        ? Object.values(item)[0].join(', ')
        : Object.values(item)[0],
    };
  });

  if (isArrayOfObjects) {
    return (
      <EuiBasicTable
        items={inputs}
        compressed
        columns={[
          {
            field: 'key',
            name: `${input.key} field`,
          },
          {
            field: 'value',
            name: `${input.key} value`,
          },
        ]}
      />
    );
  }

  const comboBoxInput =
    inputs.length === 1 && inputs[0].value === '' ? (
      inputString({ key: input.key, value: inputs[0].value })
    ) : (
      <EuiFormRow
        key={`${input.key}`}
        label={input.key}
        fullWidth
        display='columnCompressed'
      >
        <EuiComboBox
          label={input.key}
          fullWidth
          noSuggestions
          selectedOptions={inputs}
          compressed
          isDisabled
        />
      </EuiFormRow>
    );
  const tableInput = (
    <EuiBasicTable
      items={inputs}
      compressed
      columns={[
        {
          field: 'value',
          name: input.key,
        },
      ]}
    />
  );

  return renderArrayTable.every(item => input.key.startsWith(item))
    ? tableInput
    : comboBoxInput;
};
