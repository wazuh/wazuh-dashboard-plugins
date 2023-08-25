import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

export const netaddrColumns = [
  { field: 'iface', searchable: true, sortable: true },
  { field: 'address', searchable: true, sortable: true },
  { field: 'netmask', searchable: true, sortable: true },
  { field: 'proto', searchable: true, sortable: true },
  { field: 'broadcast', searchable: true, sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));