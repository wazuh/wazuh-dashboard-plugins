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
      'registry.owner',
      'Top 5 owners',
      'registry-keys-inventory',
      { size: 5, otherBucket: true },
    ),
    getVisStateDonutByField(
      indexPatternId,
      'registry.group',
      'Top 5 groups',
      'registry-keys-inventory',
      { size: 5, otherBucket: true },
    ),
    getVisStateTableByField(
      indexPatternId,
      'registry.path',
      'Top 5 paths',
      'registry-keys-inventory',
      { size: 3, fieldCustomLabel: 'Registry path' },
    ),
  ]);
};
