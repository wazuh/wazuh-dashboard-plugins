import React, { useEffect, useState } from 'react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { compose } from 'redux';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import { DashboardContainerInput } from '../../../../../../../src/plugins/dashboard/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import './styles.scss';
import { withErrorBoundary } from '../../../common/hocs';
import { DiscoverNoResults } from '../common/components/no-results';
import { LoadingSpinner } from '../common/components/loading-spinner';
import { search } from '../../../common/search-bar/search-bar-service';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardAWSComponents: React.FC = ({ pinnedAgent }) => {
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
  const handleFilterByVisualization = (newInput: DashboardContainerInput) => {
    return; // TODO: adapt to the data source
    updateFiltersStorage(newInput.filters);
  };

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
            message: 'Error fetching alerts',
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
              appName='aws-searchbar'
              {...searchBarProps}
              showDatePicker={true}
              showQueryInput={true}
              showQueryBar={true}
            />
          ) : null}
          <SampleDataWarning />
          {isSearching ? <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ? (
            <div className='aws-dashboard-responsive'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(
                    ALERTS_INDEX_PATTERN_ID,
                    !!pinnedAgent,
                  ),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
                  useMargins: true,
                  id: 'aws-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'AWS dashboard',
                  description: 'Dashboard of the AWS',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                }}
                onInputUpdated={handleFilterByVisualization}
              />
            </div>
          ) : null}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardAWS = compose(withErrorBoundary)(DashboardAWSComponents);
