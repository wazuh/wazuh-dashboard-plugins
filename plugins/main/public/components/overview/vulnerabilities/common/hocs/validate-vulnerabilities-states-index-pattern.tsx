import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { withHealthCheckChecks } from '../../../../common/hocs';
import { HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES } from '../../../../../../common/constants';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

export const PromptVulnerabilitiesIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={
      <h2>
        {i18n.translate(
          'wazuh.vulnerabilityDetection.indexPatternMissingPrompt.title',
          {
            defaultMessage:
              'Vulnerability detection seems to be disabled or has a problem',
          },
        )}
      </h2>
    }
    body={
      <>
        <p>
          {i18n.translate(
            'wazuh.vulnerabilityDetection.indexPatternMissingPrompt.description',
            {
              defaultMessage:
                'If this is enabled, then this could be caused by an error in: server side, server-indexer connection or indexer side. Review the server and indexer logs.',
            },
          )}
        </p>
        <p>
          <FormattedMessage
            id='wazuh.vulnerabilityDetection.indexPatternMissingPrompt.documentation'
            defaultMessage='Also, you can check the {documentationLink}'
            values={{
              documentationLink: (
                <EuiLink
                  href={webDocumentationLink(
                    'user-manual/capabilities/vulnerability-detection/index.html',
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {i18n.translate(
                    'wazuh.vulnerabilityDetection.indexPatternMissingPrompt.documentationLink',
                    {
                      defaultMessage: 'vulnerability detection documentation.',
                    },
                  )}
                </EuiLink>
              ),
            }}
          />
        </p>
      </>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        {i18n.translate(
          'wazuh.vulnerabilityDetection.indexPatternMissingPrompt.refreshButton',
          {
            defaultMessage: 'Refresh',
          },
        )}
      </EuiButton>
    }
  />
);

export const withVulnerabilitiesStateDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES],
  PromptVulnerabilitiesIndexPatternMissing,
);
