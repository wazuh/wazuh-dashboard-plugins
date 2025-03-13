import { KeyEquivalence } from '../../../../../common/csv-key-equivalence';

// Function to determine the column width according to the field and the operating system.
const getColumnWidth = (field: string, isLinux: boolean = false): string => {
  // If it is Linux and the field is 'argvs' or 'cmd', the width is fixed at '15%'.
  if (isLinux && (field === 'argvs' || field === 'cmd')) {
    return '15%';
  }
  // Definition of specific widths for certain fields when isLinux is false
  const widths: Record<string, string> = {
    cmd: '30%',
    argvs: '15%',
  };
  // Returns the defined width or a default value of '7%' if there is no match
  return widths[field] || '7%';
};

const mapColumns = (
  { field, ...rest }: { field: string; name?: string },
  isLinux: boolean = false,
) => ({
  ...rest,
  field,
  name: rest.name || KeyEquivalence[field] || field,
  width: getColumnWidth(field, isLinux), // Calculates the column width based on the field and the operating system
});

const windowsColumns = [
  { id: 'process.name' },
  { id: 'process.pid' },
  { id: 'process.parent.pid' },
  // { id: 'vm_size' },
  // { id: 'priority' },
  // { id: 'nlwp' },
  { id: 'process.command_line' },
];

const linuxColumns = [
  { id: 'process.name' },
  // { id: 'euser' },
  // { id: 'egroup' },
  { id: 'process.pid' },
  { id: 'process.parent.pid' },
  // { id: 'vm_size' },
  // { id: 'size' },
  // { id: 'session' },
  // { id: 'nice' },
  // { id: 'state' },
  { id: 'process.command_line' },
  { id: 'process.args' },
];

const macColumns = [
  { id: 'process.name' },
  // { id: 'euser' },
  { id: 'process.pid' },
  { id: 'process.parent.pid' },
  // { id: 'vm_size' },
  // { id: 'nice' },
];

export const processColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: macColumns,
  freebsd: linuxColumns,
  solaris: linuxColumns,
};
