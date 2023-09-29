import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

export const netifaceColumns = [
  { field: 'name', searchable: true, sortable: true, },
  { field: 'mac', searchable: true, sortable: true },
  { field: 'state', searchable: true, name: 'State', sortable: true },
  { field: 'mtu', searchable: true, name: 'MTU', sortable: true },
  { field: 'type', searchable: true, name: 'Type', sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));