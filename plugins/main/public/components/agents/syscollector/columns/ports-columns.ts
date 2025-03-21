const windowsColumns = [
  { id: 'destination.port' },
  { id: 'destination.ip' },
  { id: 'process.name' },
  { id: 'interface.state' },
  { id: 'network.transport' },
];
const linuxColumns = [
  { id: 'destination.port' },
  { id: 'destination.ip' },
  { id: 'process.name' },
  { id: 'process.pid' },
  { id: 'interface.state' },
  { id: 'network.transport' },
];
const defaultColumns = [
  { id: 'destination.port' },
  { id: 'destination.ip' },
  { id: 'interface.state' },
  { id: 'network.transport' },
];

export const portsColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: defaultColumns,
  freebsd: defaultColumns,
  solaris: defaultColumns,
};
