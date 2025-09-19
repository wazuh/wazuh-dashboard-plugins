import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStatePieByField,
} from '../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../services/visualizations';

import { SavedVis } from '../common/types';

export const getOverviewServicesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'service.name',
      'Top 5 services',
      'it-hygiene-services',
      {
        customLabel: 'Services',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'service.state',
      'Services by state',
      'it-hygiene-services-state',
      {
        fieldSize: 5,
        otherBucket: 'Others',
        metricCustomLabel: 'Service by state count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Type',
        seriesMode: 'stacked',
        fieldCustomLabel: 'Type',
      },
    ),
  ]);
};
