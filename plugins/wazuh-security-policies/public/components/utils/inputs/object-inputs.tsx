import { inputString } from './string-inputs';

export const inputObject = (
  input: { key: string; value: any },
  isEditable: boolean,
) => {
  const inputsList = Object.entries(input.value).map(([key, value]) => ({
    key: `${input.key}.${key}`,
    value,
  }));

  return inputsList.map(item => inputString(item, isEditable));
};
