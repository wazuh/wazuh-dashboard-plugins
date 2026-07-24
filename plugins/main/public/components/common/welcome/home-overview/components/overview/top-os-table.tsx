import { createTopNTable } from '../common';

export const TopOsTable = createTopNTable({
  keyColumnName: 'Operating system',
  noItemsMessage: 'No operating systems found',
  'data-test-subj': 'top-os-table',
});
