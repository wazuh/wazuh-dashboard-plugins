const windowsColumns = [
  { id: 'local.port', sortable: false },
  { id: 'process' },
  { id: 'local.ip', sortable: false },
  { id: 'state' },
  { id: 'protocol' },
];
const defaultColumns = [
  { id: 'local.port', sortable: false },
  { id: 'local.ip', sortable: false },
  { id: 'state' },
  { id: 'protocol' },
];

const linuxColumns = [
  { id: 'local.port', sortable: false },
  { id: 'process' },
  { id: 'pid' },
  { id: 'local.ip', sortable: false },
  { id: 'state' },
  { id: 'protocol' },
];

export const portsColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: defaultColumns,
  freebsd: defaultColumns,
  solaris: defaultColumns,
};
