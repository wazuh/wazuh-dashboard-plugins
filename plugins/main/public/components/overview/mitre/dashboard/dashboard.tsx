import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { Filter } from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { ErrorFactory, ErrorHandler, HttpError } from '../../../../react-services/error-management';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import { SearchResponse } from '../../../../../../../src/core/server';
import './mitre_dashboard_filters.scss';
import {
  AlertsDataSourceRepository,
  MitreAttackDataSource,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';

interface DashboardThreatHuntingProps {
  pinnedAgent: Filter;
}

const plugins = getPlugins();
const SearchBar = getPlugins().data.ui.SearchBar;
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardMITRE: React.FC<DashboardThreatHuntingProps> = ({ pinnedAgent }) => {
  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: MitreAttackDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({ query, dateRange: { from: dateRangeFrom || '', to: dateRangeTo || '' } })
      .then((results) => {
        setResults(results);
      })
      .catch((error) => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching vulnerabilities',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [JSON.stringify(fetchFilters), JSON.stringify(query), dateRangeFrom, dateRangeTo]);

  return (
    <>
      <I18nProvider>
        <>
          {isDataSourceLoading && !dataSource ? (
            <LoadingSpinner />
          ) : (
            <div className="wz-search-bar">
              <SearchBar
                appName="mitre-detector-searchbar"
                {...searchBarProps}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />
            </div>
          )}
          {dataSource && results?.hits?.total === 0 ? <DiscoverNoResults /> : null}
          {dataSource && results?.hits?.total > 0 ? (
            <div className="mitre-dashboard-responsive">
              <SampleDataWarning />
              <div className="mitre-dashboard-filters-wrapper">
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels(
                      dataSource?.id,
                      dataSource?.getPinnedAgentFilter().length > 0
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
