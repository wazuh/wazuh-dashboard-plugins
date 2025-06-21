import React from 'react';
import { EuiBasicTable, EuiFormRow, EuiComboBox } from '@elastic/eui';
import { capitalizeFirstLetter } from '../capitalize-first-letter';
import { transformInputKeyName } from '../transform-input-key-name';
import { inputString } from './string-inputs';

export const inputArray = (
  input: { key: string; value: any; handleSetItem: any; keyValue?: string },
  isEditable: boolean,
) => {
  const renderArrayTable = ['check', 'parse', 'normalize'];
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
        className='wz-mtb-10'
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

  const onChange = event => {
    const newValue = event.map(({ value }) => value);

    input.handleSetItem({
      key: transformInputKeyName(input.keyValue, input.key),
      newValue: newValue,
    });
  };

  const onCreateOption = (searchValue: string) => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    input.handleSetItem({
      key: transformInputKeyName(input.keyValue, input.key),
      newValue: [...input.value, searchValue],
    });
  };

  const comboBoxInput =
    !isEditable && inputs.length === 1 && inputs[0].value === '' ? (
      inputString(
        {
          key: input.key,
          value: inputs[0].value,
          handleSetItem: input.handleSetItem,
          keyValue: input.keyValue,
        },
        isEditable,
      )
    ) : (
      <EuiFormRow
        key={`${input.key}`}
        label={capitalizeFirstLetter(input.key)}
        fullWidth
        display='columnCompressed'
      >
        <EuiComboBox
          label={input.key}
          fullWidth
          noSuggestions
          onChange={onChange}
          placeholder={`${capitalizeFirstLetter(input.key)} value`}
          selectedOptions={
            isEditable && inputs?.[0]?.value === '' ? [] : inputs
          }
          compressed
          isDisabled={!isEditable}
          isClearable={true}
          onCreateOption={onCreateOption}
        />
      </EuiFormRow>
    );
  const tableInput = (
    <EuiBasicTable
      className='wz-mtb-10'
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
  const tableOrComboBox = renderArrayTable.filter(item =>
    input.key.startsWith(item),
  );

  return tableOrComboBox.length === 0 ? comboBoxInput : tableInput;
};
