import { KeyEquivalence } from '../../../../../common/csv-key-equivalence';

const mapColumns = ({ field, ...rest }: { field: string; name?: string }) => ({
  ...rest,
  field,
  name: rest.name || KeyEquivalence[field] || field,
});

const windowsColumns = [
  { field: 'name', searchable: true, sortable: true, width: '10%' },
  { field: 'pid', searchable: true, sortable: true },
  { field: 'ppid', searchable: true, sortable: true },
  { field: 'vm_size', searchable: true, sortable: true },
  { field: 'priority', searchable: true, sortable: true },
  { field: 'nlwp', searchable: true, sortable: true },
  { field: 'cmd', searchable: true, sortable: true, width: '30%' },
].map(mapColumns);

const linuxColumns = [
  { field: 'name', searchable: true, sortable: true, width: '10%' },
  { field: 'euser', searchable: true, sortable: true },
  { field: 'egroup', searchable: true, sortable: true },
  { field: 'pid', searchable: true, sortable: true },
  { field: 'ppid', searchable: true, sortable: true },
  { field: 'cmd', searchable: true, sortable: true, width: '15%' },
  { field: 'argvs', searchable: true, sortable: true, width: '15%' },
  { field: 'vm_size', searchable: true, sortable: true },
  { field: 'size', searchable: true, sortable: true },
  { field: 'session', searchable: true, sortable: true },
  { field: 'nice', searchable: true, sortable: true },
  { field: 'state', searchable: true, sortable: true, width: '15%' },
].map(mapColumns);

const macColumns = [
  { field: 'name', searchable: true, sortable: true, width: '10%' },
  { field: 'euser', searchable: true, sortable: true },
  { field: 'pid', searchable: true, sortable: true },
  { field: 'ppid', searchable: true, sortable: true },
  { field: 'vm_size', searchable: true, sortable: true },
  { field: 'nice', searchable: true, sortable: true },
].map(mapColumns);

export const processColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: macColumns,
  freebsd: linuxColumns,
  solaris: linuxColumns,
};
