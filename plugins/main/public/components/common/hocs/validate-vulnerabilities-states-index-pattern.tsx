import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuardAsync } from '../../common/hocs';
import { getSavedObjects } from '../../../kibana-services';
import { SavedObject } from '../../../react-services';
import { NOT_TIME_FIELD_NAME_INDEX_PATTERN } from '../../../../common/constants';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { vulnerabilityDetection } from '../../../utils/applications';
import { LoadingSpinnerDataSource } from '../../common/loading/loading-spinner-data-source';
import NavigationService from '../../../react-services/navigation-service';

const INDEX_PATTERN_CREATION_NO_INDEX = 'INDEX_PATTERN_CREATION_NO_INDEX';

async function checkExistenceIndexPattern(indexPatternID) {
  return await getSavedObjects().client.get('index-pattern', indexPatternID);
}

async function checkExistenceIndices(indexPatternId) {
  try {
    const fields = await SavedObject.getIndicesFields(indexPatternId);
    return { exist: true, fields };
  } catch (error) {
    return { exist: false };
  }
}

async function createIndexPattern(indexPattern, fields) {
  try {
    await SavedObject.createSavedObjectIndexPattern(
      'index-pattern',
      indexPattern,
      {
        attributes: {
          title: indexPattern,
          timeFieldName: NOT_TIME_FIELD_NAME_INDEX_PATTERN,
        },
      },
      fields,
    );
    await SavedObject.validateIndexPatternSavedObjectCanBeFound([indexPattern]);
  } catch (error) {
    return { error: error.message };
  }
}

export async function createDashboard() {
  try {
    // Create the dashboard
    const result = await SavedObject.createSavedObjectDashboard();
    console.log('Dashboard import:', result);

    let targetDashboard = result.find(
      dashboard => dashboard.id === '94febc80-55a2-11ef-a580-5b5ba88681be',
    );
    //Create the visualization
    // const pepe = await SavedObject.createSavedObjectbulk();
    // console.log(pepe, 'pepe');

    // If the dashboard is created successfully, ensure the visualization is correctly referenced
    if (result) {
      console.log(`Dashboard created successfully.`);
      return targetDashboard;
    } else {
      console.error('Failed to create dashboard.');
      return null;
    }
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return null;
  }
}

// Function to add a visualization to an existing dashboard
// async function addVisualizationToDashboard(dashboardId, visualizationId) {
//   try {
//     // Fetch the existing dashboard
//     const data = await getSavedObjects().client.get('dashboard', dashboardId);
//     console.log(data, 'data');
//     const existingDashboard = data.attributes;

//     // Modify the dashboard to include the new visualization
//     const updatedPanelsJSON = JSON.parse(existingDashboard.panelsJSON);
//     updatedPanelsJSON.push({
//       version: '2.13.0',
//       gridData: { x: 0, y: 0, w: 24, h: 15, i: visualizationId },
//       panelIndex: visualizationId,
//       embeddableConfig: {},
//       panelRefName: 'panel_1',
//     });

//     // Update the dashboard with the new visualization
//     const updateResult = await SavedObject.createSavedObjectDashboard(
//       'dashboard',
//       dashboardId,
//       {
//         ...existingDashboard,
//         panelsJSON: JSON.stringify(updatedPanelsJSON),
//       },
//     );
//     console.log('Dashboard updated with visualization:', updateResult);
//   } catch (error) {
//     console.error('Error updating dashboard with visualization:', error);
//   }
// }

// createDashboard().then(dashboardId => {
//   if (dashboardId) {
//     addVisualizationToDashboard(
//       dashboardId,
//       '5db1d75d-f680-4869-a0e8-0f2b8b05b99c',
//     );
//   }
// });

export async function validateVulnerabilitiesStateDataSources({
  vulnerabilitiesStatesindexPatternID: indexPatternID,
}) {
  try {
    // Check the existence of related index pattern
    const existIndexPattern = await checkExistenceIndexPattern(indexPatternID);
    let indexPattern = existIndexPattern;

    // If the index pattern does not exist, then check the existence of index
    if (existIndexPattern?.error?.statusCode === 404) {
      // Check the existence of indices
      const { exist, fields } = await checkExistenceIndices(indexPatternID);

      if (!exist) {
        return {
          ok: true,
          data: {
            error: {
              title:
                'Vulnerability detection seems to be disabled or has a problem',
              type: INDEX_PATTERN_CREATION_NO_INDEX,
            },
          },
        };
      }
      // If some index matches the index pattern, then create the index pattern
      const resultCreateIndexPattern = await createIndexPattern(
        indexPatternID,
        fields,
      );
      if (resultCreateIndexPattern?.error) {
        return {
          ok: true,
          data: {
            error: {
              title: 'There was a problem creating the index pattern',
              message: resultCreateIndexPattern?.error,
            },
          },
        };
      }
      /* WORKAROUND: Redirect to the root of Vulnerabilities Detection application that should
        redirects to the Dashboard tab. We want to redirect to this view, because we need the
        component is visible (visualizations) to ensure the process that defines the filters for the
        Events tab is run when the Dashboard component is unmounted. This workaround solves a
        problem in the Events tabs related there are no implicit filters when accessing if the HOC
        that protect the view is passed.
      */
      NavigationService.getInstance().navigateToApp(vulnerabilityDetection.id);
    }
    return {
      ok: false,
      data: { indexPattern },
    };
  } catch (error) {
    return {
      ok: true,
      data: {
        error: { title: 'There was a problem', message: error.message },
      },
    };
  }
}

const errorPromptBody = {
  INDEX_PATTERN_CREATION_NO_INDEX: (
    <p>
      Please check the cluster status. Also, you can check the{' '}
      <EuiLink
        href={webDocumentationLink(
          'user-manual/capabilities/vulnerability-detection/index.html',
        )}
        target='_blank'
        rel='noopener noreferrer'
        external
      >
        vulnerability detection documentation.
      </EuiLink>
    </p>
  ),
};

export const PromptCheckIndex = props => {
  const { refresh } = props;
  const { title, message } = props?.error;
  const body = errorPromptBody?.[props?.error?.type] || <p>{message}</p>;

  return (
    <EuiEmptyPrompt
      iconType='alert'
      title={<h2>{title}</h2>}
      body={body}
      actions={
        <EuiButton color='primary' fill onClick={refresh}>
          Refresh
        </EuiButton>
      }
    />
  );
};

const mapStateToProps = state => ({
  vulnerabilitiesStatesindexPatternID:
    state.appConfig.data['vulnerabilities.pattern'],
});

export const withVulnerabilitiesStateDataSource = compose(
  connect(mapStateToProps),
  withGuardAsync(
    validateVulnerabilitiesStateDataSources,
    ({ error, check }) => <PromptCheckIndex error={error} refresh={check} />,
    () => <LoadingSpinnerDataSource />,
  ),
);
