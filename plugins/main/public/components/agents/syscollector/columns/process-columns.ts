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
  { field: 'name', searchable: true, sortable: true, width: '10%' },
  { field: 'pid', searchable: true, sortable: true },
  { field: 'ppid', searchable: true, sortable: true },
  { field: 'vm_size', searchable: true, sortable: true },
  { field: 'priority', searchable: true, sortable: true },
  { field: 'nlwp', searchable: true, sortable: true },
  { field: 'cmd', searchable: true, sortable: true, width: '30%' },
  // TODO: review if this is working as expected
].map(mapColumns);

const linuxColumns = [
  { field: 'name', searchable: true, sortable: true },
  { field: 'euser', searchable: true, sortable: true },
  { field: 'egroup', searchable: true, sortable: true },
  { field: 'pid', searchable: true, sortable: true },
  { field: 'ppid', searchable: true, sortable: true },
  { field: 'vm_size', searchable: true, sortable: true },
  { field: 'size', searchable: true, sortable: true },
  { field: 'session', searchable: true, sortable: true },
  { field: 'nice', searchable: true, sortable: true },
  { field: 'state', searchable: true, sortable: true },
  { field: 'cmd', searchable: true, sortable: true },
  { field: 'argvs', searchable: true, sortable: true },
].map(column => mapColumns(column, true));

const macColumns = [
  { field: 'name', searchable: true, sortable: true, width: '10%' },
  { field: 'euser', searchable: true, sortable: true },
  { field: 'pid', searchable: true, sortable: true },
  { field: 'ppid', searchable: true, sortable: true },
  { field: 'vm_size', searchable: true, sortable: true },
  { field: 'nice', searchable: true, sortable: true },
  // TODO: review if this is working as expected
].map(mapColumns);

export const processColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: macColumns,
  freebsd: linuxColumns,
  solaris: linuxColumns,
};
