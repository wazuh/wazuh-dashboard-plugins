import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { withHealthCheckChecks } from '../../../../common/hocs';
import { HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES } from '../../../../../../common/constants';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { vulnerabilitiesI18n } from '../../i18n';

export const PromptVulnerabilitiesIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>{vulnerabilitiesI18n.indexPatternMissingTitle}</h2>}
    body={
      <>
        <p>{vulnerabilitiesI18n.indexPatternMissingBody}</p>
        <p>
          {vulnerabilitiesI18n.indexPatternMissingDocsIntro}{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/vulnerability-detection/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            {vulnerabilitiesI18n.indexPatternMissingDocs}
          </EuiLink>
        </p>
      </>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        {vulnerabilitiesI18n.refresh}
      </EuiButton>
    }
  />
);

export const withVulnerabilitiesStateDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES],
  PromptVulnerabilitiesIndexPatternMissing,
);
