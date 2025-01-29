import { useLocation } from 'react-router-dom';
import { transformInputKeyName } from '../transform-input-key-name';
import { inputString } from './string-inputs';
import { inputArray } from './array-inputs';
import { inputObject } from './object-inputs';

const possibleSteps = new Set([
  'metadata',
  'check',
  'normalize',
  'allow',
  'output',
  'definitions',
]);

export const renderInputs = (input: {
  key: string;
  value: any;
  handleSetItem: any;
  keyValue?: string;
}) => {
  const isEditable =
    useLocation().pathname.includes('edit') ||
    useLocation().pathname.includes('create');

  if (possibleSteps.has(input.key) && typeof input.value !== 'string') {
    const inputsSteps = Object.entries(input.value).map(([key, value]) => ({
      key,
      value,
    }));

    return inputsSteps.map(step =>
      renderInputs({
        ...step,
        handleSetItem: input.handleSetItem,
        keyValue: transformInputKeyName(input.keyValue, input.key),
      }),
    );
  }

  if (typeof input.value === 'string') {
    return inputString(input, isEditable);
  }

  return Array.isArray(input.value)
    ? inputArray(input, isEditable)
    : inputObject(input, isEditable);
};
