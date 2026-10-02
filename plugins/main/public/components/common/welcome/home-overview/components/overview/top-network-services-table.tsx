import { i18n } from '@osd/i18n';
import { createTopNTable } from '../common';

export const TopNetworkServicesTable = createTopNTable({
  keyColumnName: i18n.translate(
    'wazuh.common.homeOverviewNetworkServices.processNameColumn',
    { defaultMessage: 'Process name' },
  ),
  noItemsMessage: i18n.translate(
    'wazuh.common.homeOverviewNetworkServices.noServices',
    { defaultMessage: 'No network services found' },
  ),
  totalSlots: 5,
  moreItemsMessage: i18n.translate(
    'wazuh.common.homeOverviewNetworkServices.noMoreServices',
    { defaultMessage: 'No more network services detected' },
  ),
  'data-test-subj': 'top-network-services-table',
});
