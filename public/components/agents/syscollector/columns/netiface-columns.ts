import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

export const netifaceColumns = [
  { field: 'name', sortable: true },
  { field: 'mac', sortable: true },
  { field: 'state', name: 'State', sortable: true },
  { field: 'mtu', name: 'MTU', sortable: true },
  { field: 'type', name: 'Type', sortable: true },
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));