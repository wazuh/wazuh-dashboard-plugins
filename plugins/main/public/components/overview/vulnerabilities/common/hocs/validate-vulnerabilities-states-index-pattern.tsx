import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { withHealthCheckChecks } from '../../../../common/hocs';
import { HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES } from '../../../../../../common/constants';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

export const PromptVulnerabilitiesIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={
      <h2>Vulnerability detection seems to be disabled or has a problem</h2>
    }
    body={
      <>
        <p>
          If this is enabled, then this could be caused by an error in: server
          side, server-indexer connection or indexer side. Review the server and
          indexer logs.
        </p>
        <p>
          Also, you can check the{' '}
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
      </>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        Refresh
      </EuiButton>
    }
  />
);

export const withVulnerabilitiesStateDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES],
  PromptVulnerabilitiesIndexPatternMissing,
);
