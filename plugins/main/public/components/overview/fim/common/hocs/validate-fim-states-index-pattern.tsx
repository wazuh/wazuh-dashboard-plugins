import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import {
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_FILES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_VALUES_STATES,
} from '../../../../../../common/constants';
import { withHealthCheckChecks } from '../../../../common/hocs';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { fimI18n } from '../../i18n';

export const PromptFIMIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>{fimI18n.indexPatternMissingTitle}</h2>}
    body={
      <>
        <p>{fimI18n.indexPatternMissingBody}</p>
        <p>
          {fimI18n.indexPatternMissingDocsIntro}{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/file-integrity/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            {fimI18n.indexPatternMissingDocs}
          </EuiLink>
        </p>
      </>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        {fimI18n.refresh}
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
