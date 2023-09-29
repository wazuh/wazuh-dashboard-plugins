import React from 'react';
import { KbnSearchBar } from '../../../../kbn-search-bar';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { TimeRange, Query, Filter } from '../../../../../../../../src/plugins/data/public';
import { getDashboardPanels } from './dashboard-panels';
import { useDashboardConfiguration } from '../hooks/use-dashboard-configuration';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardVuls: React.FC = () => {
  const { configuration, updateConfiguration } = useDashboardConfiguration({
    viewMode: ViewMode.VIEW,
    panels: getDashboardPanels(),
    isFullScreenMode: false,
    filters: [],
    useMargins: true,
    id: 'random-id',
    timeRange: plugins.data.query.timefilter.timefilter.getTime(),
    title: 'new title',
    description: 'description',
    query: plugins.data.query.queryString.getQuery(),
    refreshConfig: {
      pause: false,
      value: 15,
    },
    hidePanelTitles: false,
  });

  const handleQueryUpdate = ({ dateRange, query }: { dateRange: TimeRange; query: Query }) => {
    updateConfiguration({
      ...configuration,
      query,
      timeRange: dateRange,
    });
  };

  const handleFiltersUpdate = (filters: Filter[]) => {
    updateConfiguration({
      ...configuration,
      filters,
    });
  };

  return (
    <>
      <KbnSearchBar
        appName="vulnerability detector module"
        onFiltersUpdated={handleFiltersUpdate}
        onQuerySubmit={handleQueryUpdate}
      />
      <DashboardByRenderer input={configuration} />
    </>
  );
};
