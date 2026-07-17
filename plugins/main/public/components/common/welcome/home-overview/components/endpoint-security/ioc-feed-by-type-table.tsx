import { createTopNTable } from '../common';

export const IocFeedByTypeTable = createTopNTable({
  keyColumnName: 'IOC feed by type (top 5)',
  noItemsMessage: 'No IOC indicators in the threat-intel feed',
  'data-test-subj': 'ioc-feed-by-type-table',
});
