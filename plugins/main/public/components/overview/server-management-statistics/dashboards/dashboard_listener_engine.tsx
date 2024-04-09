import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanelsListenerEngine } from './dashboard_panels_listener_engine';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSelect,
  EuiSpacer,
  EuiCallOut,
} from '@elastic/eui';
import './statistics_dashboard.scss';
import {
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import {
  StatisticsDataSource,
  StatisticsDataSourceRepository,
} from '../../../common/data-source/pattern/statistics';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardStatisticsProps {
  clusterNodes: any[];
  clusterNodeSelected: any;
  onSelectNode: any;
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({
  clusterNodes,
  clusterNodeSelected,
  onSelectNode,
}) => {
  const { dataSource, setFilters } = useDataSource<
    tParsedIndexPattern,
    PatternDataSource
  >({
    DataSource: StatisticsDataSource,
    repository: new StatisticsDataSourceRepository(),
  });

  const selectedNodeFilter = {
    meta: {
      removable: false,
      index: dataSource?.id,
      negate: false,
      disabled: false,
      alias: null,
      type: 'phrase',
      key: null,
      value: null,
      params: {
        query: null,
        type: 'phrase',
      },
    },
    query: {
      match: {
        nodeName: clusterNodeSelected,
      },
    },
    $state: {
      store: 'appState',
    },
  };

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters: clusterNodeSelected !== 'all' ? [selectedNodeFilter] : [],
    setFilters,
  });

  return (
    <I18nProvider>
      <>
        <EuiFlexGroup alignItems='center' justifyContent='flexEnd'>
          {!!(clusterNodes && clusterNodes.length && clusterNodeSelected) && (
            <EuiFlexItem grow={false}>
              <EuiSelect
                id='selectNode'
                options={clusterNodes}
                value={clusterNodeSelected}
                onChange={onSelectNode}
                aria-label='Select node'
              />
            </EuiFlexItem>
          )}
          <SearchBar
            appName='listener-engine-statistics-searchbar'
            {...searchBarProps}
            showDatePicker={true}
            showQueryInput={false}
            showQueryBar={true}
            showFilterBar={false}
          />
        </EuiFlexGroup>
        <EuiSpacer size={'m'} />
        <EuiCallOut
          title={
            'Remoted statistics are cumulative, this means that the information shown is since the data exists.'
          }
          iconType='iInCircle'
        />
        <div className='server-management-statistics-dashboard-responsive'>
          <DashboardByRenderer
            input={{
              viewMode: ViewMode.VIEW,
              panels: getDashboardPanelsListenerEngine(dataSource?.id),
              isFullScreenMode: false,
              filters: searchBarProps.filters ?? [],
              useMargins: true,
              id: 'listener-engine-statistics-dashboard',
              timeRange: {
                from: searchBarProps.dateRangeFrom,
                to: searchBarProps.dateRangeTo,
              },
              title: 'Listener Engine Statistics dashboard',
              description: 'Dashboard of the Listener Engine Statistics',
              query: searchBarProps.query,
              refreshConfig: {
                pause: false,
                value: 15,
              },
              hidePanelTitles: false,
            }}
          />
        </div>
      </>
    </I18nProvider>
  );
};

export const DashboardListenerEngineStatistics =
  withErrorBoundary(DashboardStatistics);
