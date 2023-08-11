import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

const windowsColumns = [
  { field: 'process', searchable: true, sortable: true },
  { field: 'local.ip', searchable: true, sortable: false },
  { field: 'local.port', searchable: true, sortable: false },
  { field: 'state', searchable: true, sortable: true },
  { field: 'protocol', searchable: true, sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const defaultColumns = [
  { field: 'local.ip', searchable: true, sortable: false },
  { field: 'local.port', searchable: true, sortable: false },
  { field: 'state', searchable: true, sortable: true },
  { field: 'protocol', searchable: true, sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));

export const portsColumns = {
  windows: windowsColumns,
  linux: defaultColumns,
  apple: defaultColumns,
  freebsd: defaultColumns,
  solaris: defaultColumns,
};
