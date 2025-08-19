export const tableColumns = [
  { id: 'agent.name' },
  { id: 'policy.name' },
  { id: 'policy.description' },
  { id: 'policy.file' },
  { id: 'check.name' },
  { id: 'check.result' },
];

export const managedFilters = [
  {
    type: 'multiSelect',
    key: 'policy.name',
    placeholder: 'Policy',
  },
  {
    type: 'multiSelect',
    key: 'check.result',
    placeholder: 'Check',
  },
];
