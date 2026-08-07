import { createTopNTable } from '../common';

export const TopNetworkServicesTable = createTopNTable({
  keyColumnName: 'Process name',
  noItemsMessage: 'No network services found',
  totalSlots: 5,
  moreItemsMessage: 'No more network services detected',
  'data-test-subj': 'top-network-services-table',
});
