import React, { useEffect, useState } from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../search_bar/use_search_bar_configuration';
import { getDashboardFilters } from './dashboard_panels_filters';
import './vulnerability_detector_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { useAppConfig } from '../../../../common/hooks';
import { search } from '../inventory/inventory_service';
import { IndexPattern } from '../../../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../../../src/core/server';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../../react-services/error-management';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { SavedObject } from '../../../../../react-services';
import { WAZUH_INDEX_TYPE_VULNERABILITIES } from '../../../../../../common/constants';
import { LoadingSpinner } from '../../common/components/loading_spinner';
const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

const DashboardVulsComponent: React.FC = () => {
  const appConfig = useAppConfig();
  const VULNERABILITIES_INDEX_PATTERN_ID =
    appConfig.data['vulnerabilities.pattern'];

  const [isCheckingIndex, setIsCheckingIndex] = useState<boolean>(false);
  const [vulnerabilityIndexChecked, setVulnerabilityIndexChecked] =
    useState<boolean>(false);
  const [resultVulnerabilityIndexData, setResultVulnerabilityIndexData] =
    useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
    filters: [],
  });
  const { isLoading, filters, query, indexPatterns } = searchBarProps;

  useEffect(() => {
    const checkVulnerabilitiesIndexFields = async () => {
      const fields = await SavedObject.getIndicesFields(
        VULNERABILITIES_INDEX_PATTERN_ID,
        WAZUH_INDEX_TYPE_VULNERABILITIES,
      );
      if (fields) {
        setVulnerabilityIndexChecked(true);
        search({
          indexPattern: indexPatterns?.[0] as IndexPattern,
          filters,
          query,
        })
          .then(results => {
            setResultVulnerabilityIndexData(results);
            setIsCheckingIndex(true);
          })
          .catch(error => {
            const searchError = ErrorFactory.create(HttpError, {
              error,
              message: 'Error fetching vulnerabilities',
            });
            ErrorHandler.handleError(searchError);
            setIsCheckingIndex(true);
          });
      } else {
        setVulnerabilityIndexChecked(false);
      }
    };
    if (!isLoading) {
      checkVulnerabilitiesIndexFields();
    }
  }, [isLoading]);

  return (
    <>
      <I18nProvider>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <SearchBar
            appName='vulnerability-detector-searchbar'
            {...searchBarProps}
            showDatePicker={false}
            showQueryInput={true}
            showQueryBar={true}
          />
        )}

        {(!isCheckingIndex && !vulnerabilityIndexChecked) ||
        resultVulnerabilityIndexData?.hits?.total === 0 ? (
          <DiscoverNoResults queryLanguage={''} />
        ) : (
          <>
            <div className='vulnerability-dashboard-filters-wrapper'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardFilters(VULNERABILITIES_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
                  useMargins: false,
                  id: 'vulnerability-detector-dashboard-tab-filters',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'Vulnerability detector dashboard filters',
                  description:
                    'Dashboard of the Vulnerability detector filters',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: true,
                }}
              />
            </div>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getKPIsPanel(VULNERABILITIES_INDEX_PATTERN_ID),
                isFullScreenMode: false,
                filters: searchBarProps.filters ?? [],
                useMargins: true,
                id: 'kpis-vulnerability-detector-dashboard-tab',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'KPIs Vulnerability detector dashboard',
                description: 'KPIs Dashboard of the Vulnerability detector',
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
                panels: getDashboardPanels(VULNERABILITIES_INDEX_PATTERN_ID),
                isFullScreenMode: false,
                filters: searchBarProps.filters ?? [],
                useMargins: true,
                id: 'vulnerability-detector-dashboard-tab',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Vulnerability detector dashboard',
                description: 'Dashboard of the Vulnerability detector',
                query: searchBarProps.query,
                refreshConfig: {
                  pause: false,
                  value: 15,
                },
                hidePanelTitles: false,
              }}
            />
          </>
        )}
      </I18nProvider>
    </>
  );
};

export const DashboardVuls = withErrorBoundary(DashboardVulsComponent);
