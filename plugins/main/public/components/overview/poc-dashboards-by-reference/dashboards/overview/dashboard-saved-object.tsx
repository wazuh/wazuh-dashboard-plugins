import React, { useState, useEffect } from 'react';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { GenericRequest } from '../../../../../react-services/generic-request';
import { getPlugins } from '../../../../../kibana-services';

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

export const DashboardSavedObject = ({ savedObjectId, ...props }) => {
  const [dashboardSpecForComponent, setDashboardSpecForComponent] = useState<
    null | string
  >(null);
  useEffect(() => {
    // Get dashboard saved object specification
    (async () => {
      console.log({ props }, 'randadsa');
      const { data } = await GenericRequest.request(
        'GET',
        `/api/saved_objects/dashboard/${savedObjectId}`,
      );

      // Tranform to the expected by the render component
      const dashboardSpecRenderer = transform(data);

      setDashboardSpecForComponent(dashboardSpecRenderer);
      console.log(dashboardSpecRenderer, 'dashboardSpecRenderer');
    })();
  }, []);
  return dashboardSpecForComponent ? (
    <DashboardByRenderer
      input={{
        ...dashboardSpecForComponent,
        viewMode: ViewMode.VIEW,
        // Try to use the index pattern that the dataSource has
        // but if it is undefined use the index pattern of the hoc
        // because the first executions of the dataSource are undefined
        // and embeddables need index pattern.
        // panels: dashboardSpecForComponent.panels,
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
