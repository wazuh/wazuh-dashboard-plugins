import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { SearchResponse } from '../../../../../../../src/core/server';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';

import useSearchBar from '../../../common/search-bar/use-search-bar';
import './sca_dashboard_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis.ts';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { compose } from 'redux';
import { useDataSource } from '../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../../common/search-bar';
import { SampleDataWarning } from '../../../visualize/components';
import { WAZUH_SAMPLE_SCA } from '../../../../../common/constants';
import {
  HideOnErrorInitializatingDataSource,
  PromptErrorInitializatingDataSource,
  withErrorBoundary,
} from '../../../common/hocs';
import { withSCADataSource } from '../hocs/validate-sca-states-index-pattern';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../../common/data-source/pattern/sca';
import {
  PatternDataSource,
  tParsedIndexPattern,
} from '../../../common/data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { InventoryDashboardTable } from '../../../common/dashboards';
import { withAgent } from '../../../overview/fim/inventory/inventories/hocs';
import { CheckDetails } from './check-details-sca';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The SCA dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi and the rest of the visualizations
have different configurations at the dashboard level. */

interface DashboardSCAProps {
  indexPattern: IndexPattern;
}

const DashboardSCAComponent: React.FC<DashboardSCAProps> = ({
  indexPattern,
}) => {
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    error,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: SCAStatesDataSource,
    repository: new SCAStatesDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps, fingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query } = searchBarProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({ query })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    isDataSourceLoading,
  ]);

  // console.log('graphsss---->', {
  //   viewMode: ViewMode.VIEW,
  //   // Try to use the index pattern that the dataSource has
  //   // but if it is undefined use the index pattern of the hoc
  //   // because the first executions of the dataSource are undefined
  //   // and embeddables need index pattern.
  //   panels: getKPIsPanel(dataSource?.id || indexPattern?.id),
  //   isFullScreenMode: false,
  //   filters: fetchFilters ?? [],
  //   useMargins: true,
  //   id: 'kpis-sca-dashboard-tab',
  //   timeRange: {
  //     from: searchBarProps.dateRangeFrom,
  //     to: searchBarProps.dateRangeTo,
  //   },
  //   title: 'KPIs Security Configuration Assessment dashboard',
  //   description: 'KPIs Dashboard of the Security Configuration Assessment',
  //   query: searchBarProps.query,
  //   refreshConfig: {
  //     pause: false,
  //     value: 15,
  //   },
  //   hidePanelTitles: true,
  //   lastReloadRequestTime: fingerprint,
  // });

  return (
    <>
      <I18nProvider>
        <>
          {/* <ModuleEnabledCheck />
          {isDataSourceLoading && !dataSource ? (
            <LoadingSearchbarProgress />
          ) : ( */}
          <>
            <HideOnErrorInitializatingDataSource error={error}>
              <WzSearchBar
                appName='sca-dashboard-searchbar'
                {...searchBarProps}
                filters={filters}
                fixedFilters={fixedFilters}
                showDatePicker={false}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />
            </HideOnErrorInitializatingDataSource>
            {dataSource && results?.hits?.total === 0 ? (
              <DiscoverNoResults />
            ) : null}
            <div
              className={`sca-dashboard-responsive sca-dashboard-metrics ${
                dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
              }`}
            >
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  // Try to use the index pattern that the dataSource has
                  // but if it is undefined use the index pattern of the hoc
                  // because the first executions of the dataSource are undefined
                  // and embeddables need index pattern.
                  panels: getKPIsPanel(indexPattern?.id),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'it-hygiene-dashboard-kpis',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'IT Hygiene dashboard KPIs',
                  description: 'Dashboard of the IT Hygiene KPIs',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                  lastReloadRequestTime: fingerprint,
                }}
              />
              <SampleDataWarning categoriesSampleData={[WAZUH_SAMPLE_SCA]} />
              {/* <InventoryDashboardTable
                DataSource={SCAStatesDataSource}
                DataSourceRepositoryCreator={SCAStatesDataSourceRepository}
                showAvancedFilters={true}
                tableDefaultColumns={[]}
                managedFilters={[]}
                getDashboardPanels={() =>
                  getKPIsPanel(dataSource?.id || indexPattern?.id)
                }
                tableId='sca-policies-inventory'
                indexPattern={dataSource?.indexPattern}
                categoriesSampleData={[WAZUH_SAMPLE_SCA]}
                additionalDocumentDetailsTabs={[
                  {
                    id: 'sca-dashboard-tab',
                    title: 'Security Configuration Assessment dashboard',
                    description:
                      'Dashboard of the Security Configuration Assessment',
                    className: 'sca-dashboard-tab',
                    name: 'Check Details',
                    content: props => <CheckDetails {...props} />,
                  },
                ]}
              /> */}
            </div>
            {error && <PromptErrorInitializatingDataSource error={error} />}
          </>
          {/* )} */}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardSCA = compose(
  withErrorBoundary,
  withAgent,
  withSCADataSource,
)(DashboardSCAComponent);
