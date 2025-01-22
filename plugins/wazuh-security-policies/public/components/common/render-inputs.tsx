import React from 'react';
import {
  EuiBasicTable,
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
} from '@elastic/eui';

const possibleSteps = new Set([
  'metadata',
  'check',
  'normalize',
  'allow',
  'output',
  'definitions',
]);

const inputArray = (input: any) => {
  let onTable = false;
  const inputs = input.value.map((item: any) => {
    if (!Number.isNaN(Number.parseInt(input.key))) {
      onTable = true;

      return item;
    }

    if (typeof item === 'string') {
      onTable = true;

      return { label: item, value: item };
    }

    return Object.entries(item).map(([key, value]) => ({ key, value }));
  });
  const comboBoxInput = (
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
      columns={[
        {
          field: 'value',
          name: input.key,
        },
      ]}
    />
  );

  return onTable ? tableInput : comboBoxInput;
};

const inputString = (input: { key: string; value: any }) => (
  <EuiFormRow
    key={`${input.key}`}
    label={input.key}
    fullWidth
    display='columnCompressed'
  >
    <EuiFieldText
      value={input.value}
      name='username'
      fullWidth
      compressed
      readOnly
    />
  </EuiFormRow>
);

const inputObject = (input: { key: string; value: any }) => {
  const inputsList = Object.entries(input.value).map(([key, value]) => ({
    key: `${input.key}.${key}`,
    value,
  }));

  return inputsList.map(item => inputString(item));
};

export const renderInputs = (input: { key: string; value: any }) => {
  if (possibleSteps.has(input.key)) {
    const inputsSteps = Object.entries(input.value).map(([key, value]) => ({
      key,
      value,
    }));

    return inputsSteps.map(step => renderInputs(step));
  }

  if (typeof input.value === 'string') {
    return inputString(input);
  }

  return Array.isArray(input.value) ? inputArray(input) : inputObject(input);
};
