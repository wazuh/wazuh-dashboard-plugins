import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

const windowsColumns = [
  { field: 'name', sortable: true },
  { field: 'architecture', sortable: true, width: '10%' },
  { field: 'version', sortable: true },
  { field: 'vendor', width: '30%', sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const linuxColumns = [
  { field: 'name', sortable: true },
  { field: 'architecture', sortable: true, width: '10%' },
  { field: 'version', sortable: true },
  { field: 'vendor', sortable: true, width: '30%' },
  { field: 'description', sortable: true, width: '30%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const MacColumns = [
  { field: 'name', sortable: true },
  { field: 'version', sortable: true },
  { field: 'format', sortable: true },
  { field: 'location', sortable: true, width: '30%' },
  { field: 'description', sortable: true, width: '20%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const FreebsdColumns = [
  { field: 'name', sortable: true },
  { field: 'version', sortable: true },
  { field: 'format', sortable: true },
  { field: 'architecture', sortable: true, width: '20%' },
  { field: 'vendor', sortable: true, width: '20%' },
  { field: 'description', sortable: true, width: '30%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));

export const packagesColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: MacColumns,
  freebsd: FreebsdColumns,
  solaris: linuxColumns,
};
