import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiCallOut, EuiText } from '@elastic/eui';
import {
  CTI_LOOKUP_MAX_LENGTH,
  CTI_MAX_RESULT_WINDOW,
} from '../../../../common/cti-explorer/constants';
import type { CtiRequestError } from '../services/cti-explorer-api';
import { formatNumber } from '../utils/labels';

const getMessage = (
  error: CtiRequestError,
): { title: string; text?: string } => {
  const index = error.index ?? '';
  switch (error.code) {
    case 'forbidden':
      return {
        title: i18n.translate('wazuh.ctiExplorer.requestError.forbiddenTitle', {
          defaultMessage: 'Your user cannot read {index}',
          values: { index },
        }),
        text: i18n.translate('wazuh.ctiExplorer.requestError.forbiddenText', {
          defaultMessage:
            'Ask an administrator for read permission on this index. The rest of the page keeps working.',
        }),
      };
    case 'index_not_found':
      return {
        title: i18n.translate(
          'wazuh.ctiExplorer.requestError.indexNotFoundTitle',
          { defaultMessage: '{index} was not found', values: { index } },
        ),
        text: i18n.translate(
          'wazuh.ctiExplorer.requestError.indexNotFoundText',
          {
            defaultMessage:
              'The indexer creates it when the CTI feed syncs this content for the first time.',
          },
        ),
      };
    case 'not_found':
      return {
        title: i18n.translate('wazuh.ctiExplorer.requestError.notFoundTitle', {
          defaultMessage: 'The record is not in {index}',
          values: { index },
        }),
        text: i18n.translate('wazuh.ctiExplorer.requestError.notFoundText', {
          defaultMessage:
            'The record id may be mistyped, or the feed may not have delivered the record yet.',
        }),
      };
    case 'result_window':
      return {
        title: i18n.translate(
          'wazuh.ctiExplorer.requestError.resultWindowTitle',
          {
            defaultMessage:
              'Only the first {count} records can be paged through',
            values: { count: formatNumber(CTI_MAX_RESULT_WINDOW) },
          },
        ),
        text: i18n.translate(
          'wazuh.ctiExplorer.requestError.resultWindowText',
          {
            defaultMessage: 'Narrow the filters to reach the other records.',
          },
        ),
      };
    case 'value_too_long':
      return {
        title: i18n.translate(
          'wazuh.ctiExplorer.requestError.valueTooLongTitle',
          { defaultMessage: 'The value is too long to be in the catalog' },
        ),
        text: i18n.translate(
          'wazuh.ctiExplorer.requestError.valueTooLongText',
          {
            defaultMessage:
              'The catalog does not index values longer than {length} characters.',
            values: { length: formatNumber(CTI_LOOKUP_MAX_LENGTH) },
          },
        ),
      };
    default:
      return {
        title: index
          ? i18n.translate('wazuh.ctiExplorer.requestError.failedIndexTitle', {
              defaultMessage: 'Could not read {index}',
              values: { index },
            })
          : i18n.translate('wazuh.ctiExplorer.requestError.failedTitle', {
              defaultMessage: 'The request failed',
            }),
      };
  }
};

export const RequestErrorCallout = ({
  error,
  onRetry,
  'data-test-subj': dataTestSubj,
}: {
  error: CtiRequestError;
  onRetry?: () => void;
  'data-test-subj'?: string;
}) => {
  const { title, text } = getMessage(error);
  const retryable = !['not_found', 'result_window', 'value_too_long'].includes(
    error.code,
  );
  return (
    <EuiCallOut
      title={title}
      color={error.code === 'not_found' ? 'warning' : 'danger'}
      iconType='alert'
      size='s'
      data-test-subj={dataTestSubj ?? 'ctiExplorerRequestError'}
    >
      {text ? <p>{text}</p> : null}
      {error.reason && error.code !== 'not_found' ? (
        <EuiText size='xs' color='subdued'>
          <p>{error.reason}</p>
        </EuiText>
      ) : null}
      {onRetry && retryable ? (
        <EuiButtonEmpty size='xs' iconType='refresh' onClick={onRetry}>
          {i18n.translate('wazuh.ctiExplorer.requestError.retry', {
            defaultMessage: 'Try again',
          })}
        </EuiButtonEmpty>
      ) : null}
    </EuiCallOut>
  );
};
