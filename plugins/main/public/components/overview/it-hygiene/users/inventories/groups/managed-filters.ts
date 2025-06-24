export default [
  {
    type: 'multiSelect',
    key: 'group.name',
    placeholder: 'Group name',
  },
  {
    type: 'multiSelectInput',
    key: 'group.id',
    placeholder: 'Group ID',
    validate: (value: string) =>
      !value || /^\d+$/.test(value) ? undefined : 'Only numbers are allowed',
  },
];