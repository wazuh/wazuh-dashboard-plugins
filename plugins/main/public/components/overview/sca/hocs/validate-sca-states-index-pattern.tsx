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
import { scaI18n } from '../../i18n';

export const PromptSCAIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>{scaI18n.indexPatternMissingTitle}</h2>}
    body={
      <>
        <p>{scaI18n.indexPatternMissingBody}</p>
        <p>
          {scaI18n.indexPatternMissingDocsIntro}{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/sec-config-assessment/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            {scaI18n.indexPatternMissingDocs}
          </EuiLink>
        </p>
      </>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        {scaI18n.refresh}
      </EuiButton>
    }
  />
);

export const withSCADataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES],
  PromptSCAIndexPatternMissing,
);
