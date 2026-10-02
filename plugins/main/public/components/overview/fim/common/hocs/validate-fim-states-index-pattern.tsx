import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_FILES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_VALUES_STATES,
} from '../../../../../../common/constants';
import { withHealthCheckChecks } from '../../../../common/hocs';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

export const PromptFIMIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={
      <h2>
        {i18n.translate(
          'wazuh.fileIntegrityMonitoring.indexPatternMissingPrompt.title',
          {
            defaultMessage:
              'File integrity monitoring could be disabled or has a problem',
          },
        )}
      </h2>
    }
    body={
      <>
        <p>
          {i18n.translate(
            'wazuh.fileIntegrityMonitoring.indexPatternMissingPrompt.description',
            {
              defaultMessage:
                'If this is enabled, then this could be caused by an error in: server side, server-indexer connection or indexer side. Review the server and indexer logs.',
            },
          )}
        </p>
        <p>
          <FormattedMessage
            id='wazuh.fileIntegrityMonitoring.indexPatternMissingPrompt.documentation'
            defaultMessage='Also, you can check the {documentationLink}'
            values={{
              documentationLink: (
                <EuiLink
                  href={webDocumentationLink(
                    'user-manual/capabilities/file-integrity/index.html',
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {i18n.translate(
                    'wazuh.fileIntegrityMonitoring.indexPatternMissingPrompt.documentationLink',
                    {
                      defaultMessage:
                        'file integrity monitoring documentation.',
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
          'wazuh.fileIntegrityMonitoring.indexPatternMissingPrompt.refreshButton',
          { defaultMessage: 'Refresh' },
        )}
      </EuiButton>
    }
  />
);

export const withFIMFilesDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_FILES_STATES],
  PromptFIMIndexPatternMissing,
);

export const withFIMRegistryKeysDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES],
  PromptFIMIndexPatternMissing,
);

export const withFIMRegistryValuesDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_VALUES_STATES],
  PromptFIMIndexPatternMissing,
);
