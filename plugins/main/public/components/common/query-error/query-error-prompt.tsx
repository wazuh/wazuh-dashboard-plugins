import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { classifyQueryError } from './classify-query-error';

export interface QueryErrorPromptProps {
  error: unknown;
  /** Index pattern the failed query ran against, named on a permission error. */
  indexPatternTitle?: string;
}

/**
 * Replaces a module view whose search failed, so a missing permission (or any
 * other query error) is explained instead of leaving the page blank.
 */
export const QueryErrorPrompt: React.FC<QueryErrorPromptProps> = ({
  error,
  indexPatternTitle,
}) => {
  const { kind, message } = classifyQueryError(error);
  const isPermissionDenied = kind === 'permission-denied';

  return (
    <EuiEmptyPrompt
      iconType='alert'
      iconColor={isPermissionDenied ? 'warning' : 'danger'}
      data-test-subj={`query-error-prompt-${kind}`}
      body={
        <>
          <p>{message}</p>
          {isPermissionDenied && indexPatternTitle && (
            <p>
              {i18n.translate(
                'wazuh.common.queryError.permissionDeniedIndexPattern',
                {
                  defaultMessage:
                    'Your role does not grant read access to the {indexPattern} index pattern.',
                  values: { indexPattern: indexPatternTitle },
                },
              )}
            </p>
          )}
        </>
      }
    />
  );
};
