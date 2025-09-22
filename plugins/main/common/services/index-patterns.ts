export const indexPatternHasFields = (
  requiredFields: string[],
  indexPatternFields: { name: string }[],
) =>
  requiredFields.every(field =>
    indexPatternFields.some(({ name }) => field === name),
  );

export const indexPatternHasTimeField = (
  indexPattern: any,
  timeFieldName: true | string,
) => {
  if (timeFieldName === true) {
    return Boolean(indexPattern.attributes.timeFieldName);
  }

  return timeFieldName !== indexPattern.attributes.timeFieldName;
};
