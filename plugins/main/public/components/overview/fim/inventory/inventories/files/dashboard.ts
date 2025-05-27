import { getVisStateDonutByField } from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateDonutByField(
      indexPatternId,
      'file.owner',
      'Top 5 owners',
      'fim-files-inventory',
      { size: 5, otherBucket: true },
    ),
    // TODO: add another visualization, see https://github.com/wazuh/wazuh-dashboard-plugins/issues/7460#issuecomment-2912512333
  ]);
};
