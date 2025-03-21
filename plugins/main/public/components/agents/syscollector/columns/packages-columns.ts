const windowsColumns = [
  {
    id: 'package.name',
  },
  {
    id: 'package.architecture',
  },
  {
    id: 'package.version',
  },
  {
    id: 'package.vendor',
  },
];
const linuxColumns = [
  { id: 'package.name' },
  { id: 'package.architecture' },
  { id: 'package.version' },
  { id: 'package.vendor' },
  { id: 'package.description' },
];
const MacColumns = [
  { id: 'package.name' },
  { id: 'package.version' },
  { id: 'package.format' },
  { id: 'package.location' },
  { id: 'package.description' },
];
const FreebsdColumns = [
  { id: 'package.name' },
  { id: 'package.version' },
  { id: 'package.format' },
  { id: 'package.architecture' },
  { id: 'package.vendor' },
  { id: 'package.description' },
];

export const packagesColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: MacColumns,
  freebsd: FreebsdColumns,
  solaris: linuxColumns,
};
