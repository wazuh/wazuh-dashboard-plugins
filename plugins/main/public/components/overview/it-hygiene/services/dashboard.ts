import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateMetricUniqueCountByField,
} from '../../../../../common/dashboards/lib';

export const getOverviewServicesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'service.name',
      'Top 5 services',
      'it-hygiene-services',
      {
        fieldCustomLabel: 'Services',
      },
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'service.name',
      '',
      'it-hygiene-services',
      'Unique services',
    ),
  ]);
};
