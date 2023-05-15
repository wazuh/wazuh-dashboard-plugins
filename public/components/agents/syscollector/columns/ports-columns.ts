import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

const windowsColumns = [
  { field: 'process', sortable: true },
  { field: 'local.ip', sortable: false },
  { field: 'local.port', sortable: false },
  { field: 'state', sortable: true },
  { field: 'protocol', sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const defaultColumns = [
  { field: 'local.ip', sortable: false },
  { field: 'local.port', sortable: false },
  { field: 'state', sortable: true },
  { field: 'protocol', sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));

export const portsColumns = {
  windows: windowsColumns,
  linux: defaultColumns,
  apple: defaultColumns,
  freebsd: defaultColumns,
  solaris: defaultColumns,
};
