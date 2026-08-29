import { createTopNTable } from '../common';
import { homeOverviewI18n } from '../../i18n';

export const TopNetworkServicesTable = createTopNTable({
  keyColumnName: homeOverviewI18n.processName,
  noItemsMessage: homeOverviewI18n.noNetworkServices,
  totalSlots: 5,
  moreItemsMessage: homeOverviewI18n.noMoreNetworkServices,
  'data-test-subj': 'top-network-services-table',
});
