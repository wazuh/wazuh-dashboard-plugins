import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_ALERTS_PATTERN } from '../../../../../common/constants';
import { Filter } from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import { search } from '../../../common/search-bar/search-bar-service';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSpinner, DiscoverNoResults } from './components';
import { SearchResponse } from '../../../../../../../src/core/server';
import { DataSourceFilterManagerVulnerabilitiesStates } from '../../../../react-services/data-sources';
import './mitre_dashboard_filters.scss';

interface DashboardThreatHuntingProps {
  pinnedAgent: Filter;
}

const plugins = getPlugins();
const SearchBar = getPlugins().data.ui.SearchBar;
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardMITRE: React.FC<DashboardThreatHuntingProps> = ({
  pinnedAgent,
}) => {
  const MITRE_INDEX_PATTERN_ID = WAZUH_ALERTS_PATTERN;
  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: MITRE_INDEX_PATTERN_ID,
  });
  const { isLoading, query, indexPatterns } = searchBarProps;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  //TODO: add the hidden filters; alowed agents and hideManagerAlerts
  const fetchFilters = DataSourceFilterManagerVulnerabilitiesStates.getFilters(
    searchBarProps.filters,
    MITRE_INDEX_PATTERN_ID,
  );

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
            message: 'Error fetching MITRE',
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
              appName='mitre-searchbar'
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
            <div className='mitre-dashboard-responsive'>
              <SampleDataWarning />
              <div className='mitre-dashboard-filters-wrapper'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels(
                      MITRE_INDEX_PATTERN_ID,
                      !!pinnedAgent,
                    ),
                    isFullScreenMode: false,
                    filters: searchBarProps.filters ?? [],
                    useMargins: true,
                    id: 'mitre-dashboard-tab-filters',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'MITRE dashboard filters',
                    description: 'Dashboard of the MITRE filters',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
                  }}
                />
              </div>
            </div>
          ) : null}
        </>
      </I18nProvider>
    </>
  );
};
