import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

const windowsColumns = [
  { field: 'local.port', searchable: true, sortable: false },
  { field: 'local.ip', searchable: true, sortable: false },
  { field: 'process', searchable: true, sortable: true },
  { field: 'state', searchable: true, sortable: true },
  { field: 'protocol', searchable: true, sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const linuxColumns = [
  { field: 'local.port', searchable: true, sortable: false },
  { field: 'local.ip', searchable: true, sortable: false },
  { field: 'process', searchable: true, sortable: false },
  { field: 'pid', searchable: true, sortable: false },
  { field: 'state', searchable: true, sortable: true },
  { field: 'protocol', searchable: true, sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const defaultColumns = [
  { field: 'local.port', searchable: true, sortable: false },
  { field: 'local.ip', searchable: true, sortable: false },
  { field: 'state', searchable: true, sortable: true },
  { field: 'protocol', searchable: true, sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));

export const portsColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: defaultColumns,
  freebsd: defaultColumns,
  solaris: defaultColumns,
};
