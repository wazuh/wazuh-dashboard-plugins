export const transformInputKeyName = (
  parentKey: string | undefined,
  currentKey: string,
) => (parentKey ? `${parentKey}.${currentKey}` : currentKey);
