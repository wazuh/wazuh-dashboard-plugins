import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

export const netaddrColumns = [
  { field: 'iface', sortable: true },
  { field: 'address', sortable: true },
  { field: 'netmask', sortable: true },
  { field: 'proto', sortable: true },
  { field: 'broadcast', sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));