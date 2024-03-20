import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_ALERTS_PATTERN } from '../../../../../common/constants';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { Filter } from '../../../../../../../src/plugins/data/common';
import { search } from '../../../common/search-bar/search-bar-service';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSpinner } from '../../vulnerabilities/common/components/loading_spinner';
import { DiscoverNoResults } from '../components/no_results';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import './virustotal_dashboard.scss';
import { SampleDataWarning } from '../../../visualize/components/sample-data-warning';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardVTProps {
  pinnedAgent: Filter;
}

const DashboardVT: React.FC<DashboardVTProps> = ({ pinnedAgent }) => {
  /* TODO: Analyze whether to use the new index pattern handler https://github.com/wazuh/wazuh-dashboard-plugins/issues/6434
  Replace WAZUH_ALERTS_PATTERN with appState.getCurrentPattern... */
  const VT_INDEX_PATTERN_ID = WAZUH_ALERTS_PATTERN;

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: VT_INDEX_PATTERN_ID,
  });

  const { isLoading, query, indexPatterns } = searchBarProps;
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (!isLoading) {
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: searchBarProps.filters ?? [],
        query,
      })
        .then(results => {
          setResults(results);
          setIsSearching(false);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching results',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [JSON.stringify(searchBarProps)]);

  return (
    <I18nProvider>
      <>
        {isLoading ? <LoadingSpinner /> : null}
        {!isLoading ? (
          <SearchBar
            appName='vt-searchbar'
            {...searchBarProps}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
          />
        ) : null}
        {isSearching ? <LoadingSpinner /> : null}
        {!isLoading && !isSearching && results?.hits?.total > 0 ? (
          <SampleDataWarning />
        ) : null}
        {!isLoading && !isSearching && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isLoading && !isSearching && results?.hits?.total > 0 ? (
          <div className='th-dashboard-responsive'>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getKPIsPanel(VT_INDEX_PATTERN_ID),
                isFullScreenMode: false,
                filters: searchBarProps.filters ?? [],
                useMargins: true,
                id: 'kpis-vt-dashboard-tab',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'KPIs Virustotal dashboard',
                description: 'KPIs Dashboard of the Virustotal',
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
                panels: getDashboardPanels(VT_INDEX_PATTERN_ID, !!pinnedAgent),
                isFullScreenMode: false,
                filters: searchBarProps.filters ?? [],
                useMargins: true,
                id: 'vt-dashboard-tab',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Virustotal dashboard',
                description: 'Dashboard of the Virustotal',
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
  );
};

export const DashboardVirustotal = withErrorBoundary(DashboardVT);
