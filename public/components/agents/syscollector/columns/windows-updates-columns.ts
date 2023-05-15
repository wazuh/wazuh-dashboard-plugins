import { KeyEquivalence } from "../../../../../common/csv-key-equivalence";

export const windowsUpdatesColumns = [
  { field: 'hotfix', sortable: true}
].map(({field, ...rest}) => ({...rest, field, name: rest.name || KeyEquivalence[field] || field}));