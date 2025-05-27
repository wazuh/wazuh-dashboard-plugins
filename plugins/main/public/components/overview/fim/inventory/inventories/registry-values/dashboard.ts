import {
  getVisStateDonutByField,
  getVisStateHorizontalBarByField,
  getVisStateTableByField,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateDonutByField(
      indexPatternId,
      'registry.data.type',
      'Top 5 data type',
      'registry-values-inventory',
      { size: 5 },
    ),
    getVisStateTableByField(
      indexPatternId,
      'registry.path',
      'Top 5 paths',
      'registry-values-inventory',
      { size: 5, fieldCustomLabel: 'Registry path' },
    ),
  ]);
};
