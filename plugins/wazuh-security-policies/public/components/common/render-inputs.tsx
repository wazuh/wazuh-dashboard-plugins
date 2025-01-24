import React from 'react';
import {
  EuiBasicTable,
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
  EuiToolTip,
} from '@elastic/eui';

const possibleSteps = new Set([
  'metadata',
  'check',
  'normalize',
  'allow',
  'output',
  'definitions',
]);
const renderArrayTable = new Set(['check', 'parse|', 'normalize']);
const renderWithoutLabel = new Set(['check']);

const inputString = (input: { key: string; value: any }) => {
  if (renderWithoutLabel.has(input.key)) {
    return (
      <EuiToolTip display='block' delay='long' content={input.value}>
        <EuiFieldText
          className='eui-textTruncate'
          value={input.value || '-'}
          fullWidth
          compressed
          readOnly
        />
      </EuiToolTip>
    );
  }

  return (
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
};

const inputArray = (input: any) => {
  const inputs = input.value.map((item: any) => {
    if (!Number.isNaN(Number.parseInt(input.key))) {
      return item;
    }

    if (typeof item === 'string') {
      return { label: item, value: item };
    }

    return Object.entries(item).map(([key, value]) => ({ key, value }));
  });
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
      columns={[
        {
          field: 'value',
          name: input.key,
        },
      ]}
    />
  );

  return renderArrayTable.has(input.key) ? tableInput : comboBoxInput;
};

const inputObject = (input: { key: string; value: any }) => {
  const inputsList = Object.entries(input.value).map(([key, value]) => ({
    key: `${input.key}.${key}`,
    value,
  }));

  return inputsList.map(item => inputString(item));
};

export const renderInputs = (input: { key: string; value: any }) => {
  if (possibleSteps.has(input.key) && typeof input.value !== 'string') {
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
