export const tableColumns = [
  { id: 'wazuh.agent.name' },
  { id: 'policy.name' },
  { id: 'check.id', initialWidth: 100 },
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
    key: 'check.name',
    placeholder: 'Check',
  },
];
