import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuardAsync, withReduxProvider } from '../../../../common/hocs';
import {
  getAngularModule,
  getCore,
  getSavedObjects,
} from '../../../../../kibana-services';
import { SavedObject } from '../../../../../react-services';
import { NOT_TIME_FIELD_NAME_INDEX_PATTERN } from '../../../../../../common/constants';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import { LoadingSpinnerDataSource } from '../../../../common/loading/loading-spinner-data-source';

const INDEX_PATTERN_CREATION_NO_INDEX = 'INDEX_PATTERN_CREATION_NO_INDEX';

async function checkExistenceIndexPattern(indexPatternID: string) {
  const response = await getSavedObjects().client.get(
    'index-pattern',
    indexPatternID,
  );

  return response?.error?.statusCode !== 404;
}

async function checkExistenceIndices(indexPatternId: string) {
  try {
    const fields = await SavedObject.getIndicesFields(indexPatternId);
    return { exist: true, fields };
  } catch (error) {
    return { exist: false };
  }
}

async function createIndexPattern(indexPattern, fields: any) {
  try {
    await SavedObject.createSavedObject(
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

export async function validateVulnerabilitiesStateDataSources({
  vulnerabilitiesStatesindexPatternID: indexPatternID,
}) {
  try {
    // Check the existence of related index pattern
    const existIndexPattern = await checkExistenceIndexPattern(indexPatternID);

    // If the idnex pattern does not exist, then check the existence of index
    if (!existIndexPattern) {
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
      // If the some index match the index pattern, then create the index pattern
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
      getCore().application.navigateToApp(vulnerabilityDetection.id);
    }
    return {
      ok: false,
      data: {},
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
  withReduxProvider,
  connect(mapStateToProps),
  withGuardAsync(
    validateVulnerabilitiesStateDataSources,
    ({ error, check }) => <PromptCheckIndex error={error} refresh={check} />,
    () => <LoadingSpinnerDataSource />,
  ),
);
