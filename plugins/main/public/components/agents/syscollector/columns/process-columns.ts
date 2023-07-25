const windowsColumns = [
  { id: 'name', width: '10%' },
  { id: 'pid' },
  { id: 'ppid' },
  { id: 'vm_size' },
  { id: 'priority' },
  { id: 'nlwp' },
  { id: 'cmd', width: '30%' },
];
const linuxColumns = [
  { id: 'name', width: '10%' },
  { id: 'euser' },
  { id: 'egroup' },
  { id: 'pid' },
  { id: 'ppid' },
  { id: 'cmd', width: '15%' },
  { id: 'argvs', width: '15%' },
  { id: 'vm_size' },
  { id: 'size' },
  { id: 'session' },
  { id: 'nice' },
  { id: 'state', width: '15%' },
];
const macColumns = [
  { id: 'name', width: '10%' },
  { id: 'euser' },
  { id: 'pid' },
  { id: 'ppid' },
  { id: 'vm_size' },
  { id: 'nice' },
  { id: 'state', width: '15%' },
];

export const processColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: macColumns,
  freebsd: linuxColumns,
  solaris: linuxColumns,
};
