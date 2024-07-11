import React, { useState, useEffect } from 'react';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { GenericRequest } from '../../../../react-services/generic-request';
import { getPlugins } from '../../../../kibana-services';

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
  const [dashboardSpecForComponent, setDashboardSpecForComponent] = useState<
    null | string
  >(null);
  useEffect(() => {
    // Get dashboard saved object specification
    (async () => {
      const { data } = await GenericRequest.request(
        'GET',
        `/api/saved_objects/dashboard/${savedObjectId}`,
      );

      // Transform to the expected by the render component
      const dashboardSpecRenderer = transform(data);

      setDashboardSpecForComponent(dashboardSpecRenderer);
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
  ) : null;
};

const getAllDashboards = async () => {
  const { data } = await GenericRequest.request(
    'GET',
    '/api/saved_objects/_find?type=dashboard',
  );
  return data.saved_objects;
};

export const DashboardVuls = () => {
  const [dashboardId, setDashboardId] = useState(null);

  useEffect(() => {
    (async () => {
      const dashboards = await getAllDashboards();
      const targetDashboard = dashboards.find(
        dashboard =>
          dashboard.attributes.title === 'Vulnerabilities' &&
          dashboard.id === 'a0859140-3d2f-11ef-8bcd-9dd0603434ee',
      );

      if (targetDashboard) {
        setDashboardId(targetDashboard.id);
      }
    })();
  }, []);

  return (
    <>
      {dashboardId ? (
        <DashboardSavedObject key={dashboardId} savedObjectId={dashboardId} />
      ) : (
        <p>No matching dashboard found</p>
      )}
    </>
  );
};
