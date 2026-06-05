export const indexPatternHasMissingFields = (
  requiredFields: string[],
  indexPatternFields: { name: string }[],
) => {
  const fieldSet = new Set(indexPatternFields.map(({ name }) => name));
  return requiredFields.filter(field => !fieldSet.has(field));
};

export const indexPatternHasTimeField = (
  indexPattern: any,
  timeFieldName: true | string,
) => {
  if (timeFieldName === true) {
    return Boolean(indexPattern.attributes.timeFieldName);
  }

  return timeFieldName === indexPattern.attributes.timeFieldName;
};
