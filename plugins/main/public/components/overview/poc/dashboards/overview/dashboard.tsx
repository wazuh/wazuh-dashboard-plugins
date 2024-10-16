import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { withErrorBoundary } from '../../../../common/hocs';
import { compose } from 'redux';
import {
  withVulnerabilitiesStateDataSource,
  createDashboard,
} from '../../../../common/hocs/validate-states-index-pattern-and-dashboards';
import { SavedObject, ToastNotifications } from '../../../../../react-services';
import { EuiButton } from '@elastic/eui';
import { reportingDefinitions } from '../../../../../react-services/reporting/reporting-definitions';
import { vulnerabilityDetectionDashboardReport } from '../../../../../react-services/reporting/dashboards-generate-reports';
import { WzButtonPermissionsModalConfirm } from '../../../../common/buttons';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const transformPanelsJSON = ({ panelsJSON, references }) =>
  Object.fromEntries(
    JSON.parse(panelsJSON).map(({ gridData, panelIndex, panelRefName }) => [
      panelIndex,
      {
        gridData,
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
        const { data } = await SavedObject.getDashboardById(savedObjectId);
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

const DashboardComponent = () => {
  const [idDashboard, setIdDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousDashboardState, setPreviousDashboardState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const dashboards = await SavedObject.getAllDashboards();
        let targetDashboard = dashboards.data.saved_objects.find(
          dashboard => dashboard.id === '94febc80-55a2-11ef-a580-5b5ba88681be',
        );

        if (!targetDashboard) {
          const newDashboardId = await createDashboard();
          if (newDashboardId) {
            targetDashboard = { id: newDashboardId.id };
            setIdDashboard(targetDashboard.id);
          }
        } else {
          setIdDashboard(targetDashboard.id);
          setPreviousDashboardState(targetDashboard);
        }
      } catch (error) {
        console.error('Error processing dashboards:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [idDashboard]);

  const handleRestart = async () => {
    try {
      const savedObjectId = '94febc80-55a2-11ef-a580-5b5ba88681be';
      const dashboardChanged = await SavedObject.getDashboardById(
        savedObjectId,
      );

      const changed =
        JSON.stringify(dashboardChanged) !==
        JSON.stringify(previousDashboardState);

      if (changed) {
        if (
          window.confirm(
            'The dashboard has changed. Do you want to revert to the previous version?',
          )
        ) {
          await createDashboard(); // Restore the dashboard to its previous state
          setIdDashboard(null); // Force re-rendering
          setTimeout(() => setIdDashboard(savedObjectId), 0); // Reassign ID to render the restored dashboard
        }
      } else {
        alert('No changes detected in the dashboard.');
      }
    } catch (error) {
      console.error('Error processing dashboard changes:', error);
    }
  };

  const handleRestartReportDefinition = async () => {
    try {
      ToastNotifications.add({
        title: 'Restarting report definition...',
        color: 'primary',
      });
      await reportingDefinitions.overrideReportDefinition(
        vulnerabilityDetectionDashboardReport.idDashboardByReference,
      );
      ToastNotifications.success({
        title: 'Report definition restarted successfully.',
      });
    } catch (error) {
      ToastNotifications.error(
        'plugins/main/public/components/overview/poc/dashboards/overview/dashboard.tsx',
        error,
      );
    }
    ToastNotifications;
  };

  return (
    <>
      {idDashboard ? (
        <>
          <EuiButton onClick={handleRestart}>Restart</EuiButton>
          <WzButtonPermissionsModalConfirm
            permissions={[
              {
                action: 'cluster:admin/opendistro/reports/definition/create',
                resource: '*:*:*',
              },
              {
                action: 'cluster:admin/opendistro/reports/definition/update',
                resource: '*:*:*',
              },
            ]}
            className='wz-margin-10'
            onConfirm={handleRestartReportDefinition}
            modalTitle='Do you want to restart the report definition?'
            tooltip={{
              content:
                'This will restart the definition of the report to the default',
              position: 'top',
            }}
            modalProps={{
              confirmButtonDisabled: false,
              cancelButtonDisabled: false,
              defaultFocusedButton: 'confirm',
            }}
          >
            Restart report definition
          </WzButtonPermissionsModalConfirm>
          <DashboardSavedObject key={idDashboard} savedObjectId={idDashboard} />
        </>
      ) : isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <p>No matching dashboard found.</p>
      )}
    </>
  );
};

export const DashboardPOCByReference = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(DashboardComponent);
