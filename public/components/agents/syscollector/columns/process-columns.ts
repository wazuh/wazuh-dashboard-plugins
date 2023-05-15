import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

const windowsColumns = [
  { field: 'name', sortable: true, width: '10%' },
  { field: 'pid', sortable: true },
  { field: 'ppid', sortable: true },
  { field: 'vm_size', sortable: true },
  { field: 'priority', sortable: true },
  { field: 'nlwp', sortable: true },
  { field: 'cmd', sortable: true, width: '30%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const linuxColumns = [
  { field: 'name', sortable: true, width: '10%' },
  { field: 'euser', sortable: true },
  { field: 'egroup', sortable: true },
  { field: 'pid', sortable: true },
  { field: 'ppid', sortable: true },
  { field: 'cmd', sortable: true, width: '15%' },
  { field: 'argvs', sortable: true, width: '15%' },
  { field: 'vm_size', sortable: true },
  { field: 'size', sortable: true },
  { field: 'session', sortable: true },
  { field: 'nice', sortable: true },
  { field: 'state', sortable: true, width: '15%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const macColumns = [
  { field: 'name', sortable: true, width: '10%' },
  { field: 'euser', sortable: true },
  { field: 'pid', sortable: true },
  { field: 'ppid', sortable: true },
  { field: 'vm_size', sortable: true },
  { field: 'nice', sortable: true },
  { field: 'state', sortable: true, width: '15%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));

export const processColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: macColumns,
  freebsd: linuxColumns,
  solaris: linuxColumns,
};
