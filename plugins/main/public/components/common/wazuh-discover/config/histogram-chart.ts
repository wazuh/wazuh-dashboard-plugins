import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { WazuhDiscoverDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/wazuh-discover/events/dashboard';

export const getDiscoverPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new WazuhDiscoverDashboardConfig(indexPatternId).getDashboardPanels();
};

export const histogramChartInput = (
  indexPatternId: string,
  filters,
  query,
  dateRangeFrom,
  dateRangeTo,
  lastReloadRequestTime,
) => ({
  viewMode: ViewMode.VIEW,
  panels: getDiscoverPanels(indexPatternId),
  isFullScreenMode: false,
  filters: filters ?? [],
  useMargins: false,
  id: 'wz-discover-events-histogram',
  timeRange: {
    from: dateRangeFrom,
    to: dateRangeTo,
  },
  title: 'Discover Events Histogram',
  description: 'Histogram of events by date',
  query: query,
  refreshConfig: {
    pause: false,
    value: 15,
  },
  hidePanelTitles: true,
  lastReloadRequestTime,
});
