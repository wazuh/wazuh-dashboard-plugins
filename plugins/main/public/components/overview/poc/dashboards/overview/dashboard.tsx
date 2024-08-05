import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { getDashboardFilters } from './dashboard_panels_filters';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';
import { compose } from 'redux';
import {
  withVulnerabilitiesStateDataSource,
  createDashboard,
} from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { ModuleEnabledCheck } from '../../common/components/check-module-enabled';

import {
  VulnerabilitiesDataSourceRepository,
  VulnerabilitiesDataSource,
  PatternDataSource,
  tParsedIndexPattern,
} from '../../../../common/data-source';
import { useDataSource } from '../../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../../../common/search-bar';
import { GenericRequest } from '../../../../../react-services/generic-request';
import { SavedObject } from '../../../../../react-services';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;
const transformPanelsJSON = ({ panelsJSON, references }) =>
  Object.fromEntries(
    JSON.parse(panelsJSON).map(({ gridData, panelIndex, panelRefName }) => [
      panelIndex,
      {
        gridData: gridData,
        type: 'visualization',
        explicitInput: {
          id: panelIndex,
          savedObjectId: references.find(({ name }) => name === panelRefName)
            .id,
        },
      },
    ]),
  );

const transform = spec => {
  const options = JSON.parse(spec.attributes.optionsJSON);
  return {
    title: spec.attributes.title,
    panels: transformPanelsJSON({
      panelsJSON: spec.attributes.panelsJSON,
      references: spec.references,
    }),
    useMargins: options.useMargins,
    hidePanelTitles: options.hidePanelTitles,
    description: spec.attributes.description,
    id: spec.id,
  };
};

export const DashboardSavedObject = ({ savedObjectId }) => {
  const [dashboardSpecForComponent, setDashboardSpecForComponent] =
    useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await GenericRequest.request(
          'GET',
          `/api/saved_objects/dashboard/${savedObjectId}`,
        );
        // Transform to the expected by the render component
        const dashboardSpecRenderer = transform(data);
        setDashboardSpecForComponent(dashboardSpecRenderer);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }
    })();
  }, [savedObjectId]);

  return dashboardSpecForComponent ? (
    <DashboardByRenderer
      input={{
        ...dashboardSpecForComponent,
        viewMode: ViewMode.VIEW,
        isFullScreenMode: false,
        filters: [],
        query: '',
        refreshConfig: {
          pause: false,
          value: 15,
        },
      }}
    />
  ) : (
    <p>Loading dashboard...</p>
  );
};
const getAllDashboards = async () => {
  try {
    const { data } = await GenericRequest.request(
      'GET',
      '/api/saved_objects/_find?type=dashboard',
    );
    return data.saved_objects;
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return [];
  }
};

const DashboardComponent = () => {
  const [idDashboard, setIdDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dashboards = await getAllDashboards();
        let targetDashboard = dashboards.find(
          dashboard =>
            dashboard.attributes.title === 'Agents and Vuls' &&
            dashboard.id === '6e71e2a1-89ca-49c9-b9e6-1f2aa404903b',
        );

        if (!targetDashboard) {
          const newDashboardId = await createDashboard();
          if (newDashboardId) {
            targetDashboard = { id: newDashboardId };
          }
        }

        if (targetDashboard) {
          setIdDashboard(targetDashboard.id);
        }
      } catch (error) {
        console.error('Error processing dashboards:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {idDashboard ? (
        <DashboardSavedObject key={idDashboard} savedObjectId={idDashboard} />
      ) : isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <p>No matching dashboard found.</p>
      )}
    </>
  );
};

export const DashboardVuls = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(DashboardComponent);
