export default [
  {
    type: 'multiSelect',
    key: 'process.name',
    placeholder: 'Process name',
  },
  {
    type: 'multiSelectInput',
    key: 'source.port',
    placeholder: 'Source port',
    validate: value =>
      !value || /^\d+$/.test(value) ? undefined : 'Only numbers are allowed',
  },
  {
    type: 'multiSelect',
    key: 'network.transport',
    placeholder: 'Transport protocol',
  },
  {
    type: 'multiSelect',
    key: 'interface.state',
    placeholder: 'State',
  },
];
