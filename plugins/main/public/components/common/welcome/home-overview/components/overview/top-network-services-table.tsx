import { createTopNTable } from '../common';

export const TopNetworkServicesTable = createTopNTable({
  keyColumnName: 'Process name',
  noItemsMessage: 'No network services found',
  'data-test-subj': 'top-network-services-table',
});
