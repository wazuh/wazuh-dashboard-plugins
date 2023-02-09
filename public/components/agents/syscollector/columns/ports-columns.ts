const windowsColumns = [
  { id: 'process' },
  { id: 'local.ip', sortable: false },
  { id: 'local.port', sortable: false },
  { id: 'state' },
  { id: 'protocol' },
];
const defaultColumns = [
  { id: 'local.ip', sortable: false },
  { id: 'local.port', sortable: false },
  { id: 'state' },
  { id: 'protocol' },
];

export const portsColumns = {
  windows: windowsColumns,
  linux: defaultColumns,
  apple: defaultColumns,
  freebsd: defaultColumns,
  solaris: defaultColumns,
};
