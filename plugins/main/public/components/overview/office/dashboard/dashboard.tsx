import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../src/core/server';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { withErrorBoundary } from '../../../common/hocs';
import { DiscoverNoResults } from '../common/components/no_results';
import { LoadingSpinner } from '../common/components/loading_spinner';
import { search } from '../../../common/search-bar/search-bar-service';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { compose } from 'redux';
import { SampleDataWarning } from '../../../visualize/components';
import { getKPIsPanel } from './dashboard_panels_kpis';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardOffice365Component: React.FC = () => {
  const ALERTS_INDEX_PATTERN_ID = 'wazuh-alerts-*'; // TODO: use the data source
  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: ALERTS_INDEX_PATTERN_ID,
    onMount: () => {}, // TODO: use data source
    onUpdate: () => {}, // TODO: use data source
    onUnMount: () => {}, // TODO: use data source
  });

  /* This function is responsible for updating the storage filters so that the
  filters between dashboard and inventory added using visualizations call to actions.
  Without this feature, filters added using visualizations call to actions are
  not maintained between dashboard and inventory tabs */
  // const handleFilterByVisualization = (newInput: DashboardContainerInput) => {
  //   return; // TODO: adapt to the data source
  //   updateFiltersStorage(newInput.filters);
  // };

  // TODO: add the hidden filters: allowed agents and hideManagerAlerts
  const fetchFilters = searchBarProps.filters;

  const { isLoading, query, indexPatterns } = searchBarProps;

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (!isLoading) {
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: fetchFilters,
        query,
      })
        .then(results => {
          setResults(results);
          setIsSearching(false);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching vulnerabilities',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [JSON.stringify(searchBarProps), JSON.stringify(fetchFilters)]);

  return (
    <>
      <I18nProvider>
        <>
          {isLoading ? <LoadingSpinner /> : null}
          {!isLoading ? (
            <SearchBar
              appName='pci-dss-searchbar'
              {...searchBarProps}
              showDatePicker={true}
              showQueryInput={true}
              showQueryBar={true}
            />
          ) : null}
          {isSearching ? <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ? (
            <div className='office-365-dashboard-responsive'>
              <SampleDataWarning />
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getKPIsPanel(ALERTS_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
                  useMargins: true,
                  id: 'kpis-th-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'KPIs Office 365 dashboard',
                  description: 'KPIs Dashboard of the Office 365',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: true,
                }}
              />
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(ALERTS_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'office-365-detector-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'Office 365 detector dashboard',
                  description: 'Dashboard of the Office 365',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                }}
              />
            </div>
          ) : null}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardOffice365 = compose(withErrorBoundary)(
  DashboardOffice365Component,
);
