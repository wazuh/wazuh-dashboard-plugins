const windowsColumns = [
  { id: 'name' },
  { id: 'architecture', width: '10%' },
  { id: 'version' },
  { id: 'vendor', width: '30%' },
];
const linuxColumns = [
  { id: 'name' },
  { id: 'architecture', width: '10%' },
  { id: 'version' },
  { id: 'vendor', width: '30%' },
  { id: 'description', width: '30%' },
];
const MacColumns = [
  { id: 'name' },
  { id: 'version' },
  { id: 'format' },
  { id: 'location', width: '30%' },
  { id: 'description', width: '20%' },
];
const FreebsdColumns = [
  { id: 'name' },
  { id: 'version' },
  { id: 'format' },
  { id: 'architecture', width: '20%' },
  { id: 'vendor', width: '20%' },
  { id: 'description', width: '30%' },
];

export const packagesColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: MacColumns,
  freebsd: FreebsdColumns,
  solaris: linuxColumns,
};
