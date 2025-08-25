/**
 * @fileoverview This file provides a Higher Order Component (HOC) to validate
 * and manage index patterns related to Security Configuration Assessment (SCA)
 * in Wazuh Dashboard.
 * @module components/agents/sca/hocs/validate-sca-states-index-pattern
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES } from '../../../../../common/constants';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { withHealthCheckChecks } from '../../../common/hocs';

export const PromptSCAIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>Configuration Assessment could be disabled or has a problem</h2>}
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
              'user-manual/capabilities/sec-config-assessment/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            configuration assessment documentation.
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

export const withSCADataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES],
  PromptSCAIndexPatternMissing,
);
