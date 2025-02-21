import React from 'react';
import { getPlugins } from '../../../../plugin-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { useTimeFilter } from '../../../common/table-indexer/components/search-bar/hooks/use-time-filter';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import { getDashboardPanels } from './dashboard_panels';

export interface EventsCountProps {
  indexPattern: any;
  filters: any[];
}

export const EventsCount = ({ filters, indexPattern }: EventsCountProps) => {
  const plugins = getPlugins();
  const DashboardByRenderer =
    plugins.dashboard.DashboardContainerByValueRenderer;
  const { timeFilter } = useTimeFilter();

  return indexPattern ? (
    <DashboardByRenderer
      input={{
        viewMode: ViewMode.VIEW,
        panels: getDashboardPanels(indexPattern.id),
        isFullScreenMode: false,
        filters: filters || [],
        useMargins: true,
        id: 'agent-events-count-evolution',
        timeRange: {
          from: timeFilter.from,
          to: timeFilter.to,
        },
        title: 'Events count evolution',
        description: 'Dashboard of Events count evolution',
        refreshConfig: {
          pause: false,
          value: 15,
        },
      }}
    />
  ) : (
    <LoadingSpinner />
  );
};
