import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuardAsync } from '../../../../common/hocs';
import {
  existsIndices,
  existsIndexPattern,
  createIndexPattern,
} from '../../../../../react-services';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import { LoadingSpinnerDataSource } from '../../../../common/loading/loading-spinner-data-source';
import NavigationService from '../../../../../react-services/navigation-service';
import { HTTP_STATUS_CODES } from '../../../../../../common/constants';

const INDEX_PATTERN_CREATION_NO_INDEX = 'INDEX_PATTERN_CREATION_NO_INDEX';

export async function validateVulnerabilitiesStateDataSources({
  vulnerabilitiesStatesindexPatternID: indexPatternID,
  redirect = true,
}) {
  try {
    // Check the existence of related index pattern
    const existIndexPattern = await existsIndexPattern(indexPatternID);
    const indexPattern = existIndexPattern;

    // If the index pattern does not exist, then check the existence of index
    if (existIndexPattern?.error?.statusCode === HTTP_STATUS_CODES.NOT_FOUND) {
      // Check the existence of indices
      const { exist, fields } = await existsIndices(indexPatternID);

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
      if (redirect) {
        NavigationService.getInstance().navigateToApp(vulnerabilityDetection.id);
      }
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
