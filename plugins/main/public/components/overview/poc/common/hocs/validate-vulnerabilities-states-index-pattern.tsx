import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuardAsync } from '../../../../common/hocs';
import { getSavedObjects } from '../../../../../kibana-services';
import { SavedObject } from '../../../../../react-services';
import { NOT_TIME_FIELD_NAME_INDEX_PATTERN } from '../../../../../../common/constants';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import { LoadingSpinnerDataSource } from '../../../../common/loading/loading-spinner-data-source';
import NavigationService from '../../../../../react-services/navigation-service';

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
  const dashboardId = '6e71e2a1-89ca-49c9-b9e6-1f2aa404903b';
  const visualizationId = '28fc0100-54c1-11ef-90c6-fb0cff0a65f8';

  const dashboardData = {
    title: 'Agents and Vuls',
    description: 'Revenue dashboard',
    panelsJSON:
      '[{"version":"2.13.0","gridData":{"x":0,"y":0,"w":24,"h":15,"i":"5db1d75d-f680-4869-a0e8-0f2b8b05b99c"},"panelIndex":"5db1d75d-f680-4869-a0e8-0f2b8b05b99c","embeddableConfig":{},"panelRefName":"panel_0"}]',
    optionsJSON: '{"hidePanelTitles":false,"useMargins":true}',
    version: 1,
    timeRestore: true,
    kibanaSavedObjectMeta: {
      searchSourceJSON: '{"query":{"language":"kuery","query":""},"filter":[]}',
    },
    references: [
      {
        id: visualizationId,
        name: 'panel_0',
        type: 'visualization',
      },
    ],
  };

  const visualizationData = {
    title: 'vuls',
    visState:
      '{"title":"vuls","type":"area","aggs":[{"id":"1","enabled":true,"type":"count","params":{},"schema":"metric"},{"id":"2","enabled":true,"type":"terms","params":{"field":"vulnerability.score.temporal","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"},"schema":"segment"}],"params":{"type":"area","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"area","mode":"stacked","data":{"label":"Count","id":"1"},"drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true,"interpolate":"linear","valueAxis":"ValueAxis-1"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#E7664C"},"labels":{}}}',
    uiStateJSON: '{}',
    description: '',
    version: 1,
    kibanaSavedObjectMeta: {
      searchSourceJSON:
        '{"query":{"query":"","language":"kuery"},"filter":[],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}',
    },
    references: [
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
        id: 'wazuh-states-vulnerabilities-*',
      },
    ],
  };

  try {
    // Create the dashboard
    const result = await SavedObject.createSavedObjectDashboard(
      'dashboard',
      dashboardId,
      dashboardData,
    );
    console.log('Dashboard created:', result);
    // Create the visualization
    const resultVis = await SavedObject.createSavedObjectVisualization(
      'visualization',
      visualizationId,
    );
    console.log('Visualization created:', resultVis);

    // If the dashboard is created successfully, ensure the visualization is correctly referenced
    if (result) {
      console.log(`Dashboard ${dashboardId} created successfully.`);
      return dashboardId;
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
async function addVisualizationToDashboard(dashboardId, visualizationId) {
  try {
    // Fetch the existing dashboard
    const data = await getSavedObjects().client.get('dashboard', dashboardId);
    console.log(data, 'data');
    const existingDashboard = data.attributes;

    // Modify the dashboard to include the new visualization
    const updatedPanelsJSON = JSON.parse(existingDashboard.panelsJSON);
    updatedPanelsJSON.push({
      version: '2.13.0',
      gridData: { x: 0, y: 0, w: 24, h: 15, i: visualizationId },
      panelIndex: visualizationId,
      embeddableConfig: {},
      panelRefName: 'panel_1',
    });

    // Update the dashboard with the new visualization
    const updateResult = await SavedObject.createSavedObjectDashboard(
      'dashboard',
      dashboardId,
      {
        ...existingDashboard,
        panelsJSON: JSON.stringify(updatedPanelsJSON),
      },
    );
    console.log('Dashboard updated with visualization:', updateResult);
  } catch (error) {
    console.error('Error updating dashboard with visualization:', error);
  }
}

createDashboard().then(dashboardId => {
  if (dashboardId) {
    addVisualizationToDashboard(
      dashboardId,
      '5db1d75d-f680-4869-a0e8-0f2b8b05b99c',
    );
  }
});

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
