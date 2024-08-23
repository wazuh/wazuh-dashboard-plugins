const mapSpecTypeToInput = {
  string: 'text',
};

function createIter(fnItem) {
  function iter(spec, parent = '') {
    if (!spec.properties) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(spec.properties).reduce((accum, [key, value]) => {
        const keyPath = [parent, key].filter(v => v).join('.');
        if (value.type === 'object') {
          Object.entries(iter(value, keyPath)).forEach(entry =>
            accum.push(entry),
          );
        } else if (value.type) {
          accum.push([keyPath, fnItem({ key, keyPath, spec: value })]);
        }
        return accum;
      }, []),
    );
  }

  return iter;
}

export const transfromAssetSpecToForm = function (
  spec,
  mergeProps?: { [key: string]: string } = {},
) {
  return createIter(({ keyPath, spec }) => ({
    type: mapSpecTypeToInput[spec.type] || spec.type,
    initialValue: '',
    _spec: spec,
    ...(spec.pattern
      ? {
          validate: value =>
            new RegExp(spec.pattern).test(value)
              ? undefined
              : `Value does not match the pattern: ${spec.pattern}`,
        }
      : {}),
    ...(mergeProps?.[keyPath] ? mergeProps?.[keyPath] : {}),
  }))(spec);
};

export const transformAssetSpecToListTableColumn = function (
  spec,
  mergeProps?: { [key: string]: string } = {},
) {
  const t = createIter(({ keyPath }) => ({
    field: keyPath,
    name: keyPath,
    ...(mergeProps?.[keyPath] ? mergeProps?.[keyPath] : {}),
  }));

  return Object.entries(t(spec)).map(([key, value]) => ({
    field: key,
    ...value,
  }));
};
