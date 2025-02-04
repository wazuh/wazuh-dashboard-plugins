import React, { useState } from 'react';
import { EuiButton } from '@elastic/eui';
import { isEqual } from 'lodash';
import { inputString } from '../../../utils/inputs/string-inputs';
import { inputArray } from '../../../utils/inputs/array-inputs';

export const RenderParseStep = (props: any) => {
  const { step } = props;
  const [value, setValue] = useState('');
  const [eventField, setEventField] = useState('');
  const [valueArray, setValueArray] = useState(step?.value || []);

  const handleSetValue = ({ newValue }: { newValue: string }) => {
    setValue(newValue);
  };

  const restartValue = () => setValue('');

  const handleAddButton = () => {
    setValueArray([...valueArray, value]);
    restartValue();
  };

  const handleSaveButton = () => {
    step.handleSetItem({
      key: `${step.key}|${eventField}`,
      newValue: valueArray,
    });
  };

  const handleParseTitle = ({ newValue }: { newValue: string }) => {
    setEventField(newValue);
  };

  return (
    <>
      {inputString(
        {
          ...step,
          key: 'Field to parse',
          value: eventField,
          handleSetItem: handleParseTitle,
        },
        true,
      )}
      {inputString({ ...step, value, handleSetItem: handleSetValue }, true)}
      <EuiButton
        size='s'
        onClick={() => {
          handleAddButton();
        }}
        disabled={value === ''}
      >
        Add item
      </EuiButton>
      {inputArray({ ...step, value: valueArray }, true)}
      <EuiButton
        size='s'
        onClick={() => {
          handleSaveButton();
        }}
        disabled={valueArray.length === 0 || isEqual(valueArray, step.value)}
      >
        Save
      </EuiButton>
    </>
  );
};
