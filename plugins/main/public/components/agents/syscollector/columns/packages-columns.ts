import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

const windowsColumns = [
  { field: 'name', searchable: true, sortable: true },
  { field: 'architecture', searchable: true, sortable: true, width: '10%' },
  { field: 'version', searchable: true, sortable: true },
  { field: 'vendor', searchable: true, sortable: true, width: '30%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const linuxColumns = [
  { field: 'name', searchable: true, sortable: true },
  { field: 'architecture', searchable: true, sortable: true, width: '10%' },
  { field: 'version', searchable: true, sortable: true },
  { field: 'vendor', searchable: true, sortable: true, width: '30%' },
  { field: 'description', searchable: true, sortable: true, width: '30%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const MacColumns = [
  { field: 'name', searchable: true, sortable: true },
  { field: 'version', searchable: true, sortable: true },
  { field: 'format', searchable: true, sortable: true },
  { field: 'location', searchable: true, sortable: true, width: '30%' },
  { field: 'description', searchable: true, sortable: true, width: '20%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));
const FreebsdColumns = [
  { field: 'name', searchable: true, sortable: true },
  { field: 'version', searchable: true, sortable: true },
  { field: 'format', searchable: true, sortable: true },
  { field: 'architecture', searchable: true, sortable: true, width: '20%' },
  { field: 'vendor', searchable: true, sortable: true, width: '20%' },
  { field: 'description', searchable: true, sortable: true, width: '30%' },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));

export const packagesColumns = {
  windows: windowsColumns,
  linux: linuxColumns,
  apple: MacColumns,
  freebsd: FreebsdColumns,
  solaris: linuxColumns,
};
