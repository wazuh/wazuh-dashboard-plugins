import { useLocation } from 'react-router-dom';
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

export const renderInputs = (input: { key: string; value: any }) => {
  const isEditable =
    useLocation().pathname.includes('edit') ||
    useLocation().pathname.includes('create');

  if (possibleSteps.has(input.key) && typeof input.value !== 'string') {
    const inputsSteps = Object.entries(input.value).map(([key, value]) => ({
      key,
      value,
    }));

    return inputsSteps.map(step => renderInputs(step));
  }

  if (typeof input.value === 'string') {
    return inputString(input, isEditable);
  }

  return Array.isArray(input.value)
    ? inputArray(input, isEditable)
    : inputObject(input, isEditable);
};
