const mapSpecTypeToInput = {
  string: 'text',
  array: 'text',
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

export const transfromAssetSpecToForm = createIter(({ spec }) => ({
  type: mapSpecTypeToInput[spec.type] || spec.type,
  initialValue: '',
  ...(spec.pattern
    ? {
        validate: value =>
          new RegExp(spec.pattern).test(value)
            ? undefined
            : `Value does not match the pattern: ${spec.pattern}`,
      }
    : {}),
}));

export const transformAssetSpecToListTableColumn = function (
  spec,
  fieldNamesMap?: { [key: string]: string } = {},
) {
  const t = createIter(({ spec }) => ({
    type: mapSpecTypeToInput[spec.type] || spec.type,
    initialValue: '',
  }));

  return Object.entries(t(spec)).map(([key]) => ({
    field: key,
    name: fieldNamesMap?.[key] || key,
    sortable: true,
    show: true,
  }));
};
