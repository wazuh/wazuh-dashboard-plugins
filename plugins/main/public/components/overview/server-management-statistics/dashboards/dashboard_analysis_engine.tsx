import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { getDashboardPanelsAnalysisEngine } from './dashboard_panels_analysis_engine';
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
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardStatisticsProps {
  isClusterMode: boolean;
  clusterNodes: any[];
  clusterNodeSelected: any;
  onSelectNode: any;
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({
  isClusterMode,
  clusterNodes,
  clusterNodeSelected,
  onSelectNode,
}) => {
  const {
    fetchFilters,
    dataSource,
    setFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
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
            appName='analysis-engine-statistics-searchbar'
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
        {isDataSourceLoading && !dataSource ? (
          <LoadingSpinner />
        ) : (
          <div className='server-management-statistics-dashboard-responsive'>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getDashboardPanelsAnalysisEngine(
                  dataSource?.id!,
                  isClusterMode,
                ),
                isFullScreenMode: false,
                filters: fetchFilters ?? [],
                useMargins: true,
                id: 'analysis-engine-statistics-dashboard',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Analysis Engine Statistics dashboard',
                description: 'Dashboard of the Analysis Engine Statistics',
                query: searchBarProps.query,
                refreshConfig: {
                  pause: false,
                  value: 15,
                },
                hidePanelTitles: false,
              }}
            />
          </div>
        )}
      </>
    </I18nProvider>
  );
};

export const DashboardAnalysisEngineStatistics =
  withErrorBoundary(DashboardStatistics);
