/**
 * @fileoverview This file provides a Higher Order Component (HOC) to validate
 * and manage index patterns related to Security Configuration Assessment (SCA)
 * in Wazuh Dashboard.
 * @module components/agents/sca/hocs/validate-sca-states-index-pattern
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES } from '../../../../../common/constants';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { withHealthCheckChecks } from '../../../common/hocs';

export const PromptSCAIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={
      <h2>
        {i18n.translate(
          'wazuh.configurationAssessment.indexPatternMissingPrompt.title',
          {
            defaultMessage:
              'Configuration Assessment could be disabled or has a problem',
          },
        )}
      </h2>
    }
    body={
      <>
        <p>
          {i18n.translate(
            'wazuh.configurationAssessment.indexPatternMissingPrompt.body',
            {
              defaultMessage:
                'If this is enabled, then this could be caused by an error in: server side, server-indexer connection or indexer side. Review the server and indexer logs.',
            },
          )}
        </p>
        <p>
          <FormattedMessage
            id='wazuh.configurationAssessment.indexPatternMissingPrompt.documentation'
            defaultMessage='Also, you can check the {link}'
            values={{
              link: (
                <EuiLink
                  href={webDocumentationLink(
                    'user-manual/capabilities/sec-config-assessment/index.html',
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {i18n.translate(
                    'wazuh.configurationAssessment.indexPatternMissingPrompt.documentationLink',
                    {
                      defaultMessage: 'configuration assessment documentation.',
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
          'wazuh.configurationAssessment.indexPatternMissingPrompt.refreshButton',
          {
            defaultMessage: 'Refresh',
          },
        )}
      </EuiButton>
    }
  />
);

export const withSCADataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES],
  PromptSCAIndexPatternMissing,
);
