import { inputString } from './string-inputs';

export const inputObject = (
  input: { key: string; value: any; handleSetItem: any; keyValue?: string },
  isEditable: boolean,
) => {
  const inputsList = Object.entries(input.value).map(([key, value]) => ({
    key: `${input.key}.${key}`,
    value,
  }));

  return inputsList.map(item =>
    inputString(
      {
        ...item,
        handleSetItem: input.handleSetItem,
        keyValue: input.keyValue ?? '',
      },
      isEditable,
    ),
  );
};
