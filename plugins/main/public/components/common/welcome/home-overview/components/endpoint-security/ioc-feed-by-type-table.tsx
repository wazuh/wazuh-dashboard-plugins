import { createTopNTable } from '../common';

export const IocFeedByTypeTable = createTopNTable({
  keyColumnName: 'Top 5 IOC feed types',
  noItemsMessage: 'No IOCs in the threat-intel feed',
  'data-test-subj': 'ioc-feed-by-type-table',
});
