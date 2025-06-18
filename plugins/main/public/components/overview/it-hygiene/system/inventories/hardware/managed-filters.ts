export default [
  {
    type: 'multiSelect',
    key: 'host.cpu.name',
    placeholder: 'CPU name',
  },
  {
    type: 'multiSelectInput',
    key: 'host.cpu.cores',
    placeholder: 'CPU cores',
    validate: value =>
      !value || /^\d+$/.test(value) ? undefined : 'Only numbers are allowed',
  },
];
