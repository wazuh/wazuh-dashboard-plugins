import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCopy,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiProgress,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { CvssScore, isWebUrl } from '../../../../common/cti-catalog';
import type { CatalogRequestError } from '../../../services/cti-catalog';
import { SEVERITY_COLORS } from './catalog-labels';

export const numberFormat = new Intl.NumberFormat();

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

/**
 * Marks the one section whose request failed and names the index, so a missing
 * privilege on one index does not read as an empty catalog.
 */
export const CatalogErrorCallOut: React.FC<{
  error: CatalogRequestError;
  /** Index the section reads, when the reply did not name it. */
  index: string;
  onRetry?: () => void;
  'data-test-subj'?: string;
}> = ({ error, index, onRetry, 'data-test-subj': dataTestSubj }) => {
  const indexName = error.index ?? index;
  let title: string;
  if (error.status === HTTP_FORBIDDEN) {
    title = i18n.translate('wazuhCheckUpdates.ctiCatalog.error.forbidden', {
      defaultMessage: 'Your user cannot read the {index} index',
      values: { index: indexName },
    });
  } else if (error.status === HTTP_NOT_FOUND) {
    title = i18n.translate('wazuhCheckUpdates.ctiCatalog.error.notFound', {
      defaultMessage:
        'The {index} index does not exist yet. The feed may not have synced.',
      values: { index: indexName },
    });
  } else {
    title = i18n.translate('wazuhCheckUpdates.ctiCatalog.error.generic', {
      defaultMessage: 'Could not read the {index} index',
      values: { index: indexName },
    });
  }

  return (
    <EuiCallOut
      title={title}
      color={error.status === HTTP_NOT_FOUND ? 'warning' : 'danger'}
      iconType='alert'
      size='s'
      data-test-subj={dataTestSubj}
    >
      <EuiText size='xs'>
        <p>{error.message}</p>
      </EuiText>
      {onRetry ? (
        <EuiButton size='s' color='danger' onClick={onRetry}>
          {i18n.translate('wazuhCheckUpdates.ctiCatalog.error.retry', {
            defaultMessage: 'Try again',
          })}
        </EuiButton>
      ) : null}
    </EuiCallOut>
  );
};

/** CVSS score and its severity label; a score without a label shows only the number. */
export const ScoreBadge: React.FC<{ score?: CvssScore }> = ({ score }) => {
  if (!score) {
    return (
      <EuiText size='xs' color='subdued'>
        {i18n.translate('wazuhCheckUpdates.ctiCatalog.score.none', {
          defaultMessage: 'Not scored',
        })}
      </EuiText>
    );
  }
  const label = score.severity
    ? `${score.score} ${score.severity}`
    : String(score.score);
  return (
    <EuiToolTip
      content={i18n.translate('wazuhCheckUpdates.ctiCatalog.score.tooltip', {
        defaultMessage: 'CVSS {version} base score, from {source}',
        values: { version: score.version ?? '?', source: score.source },
      })}
    >
      <EuiBadge
        color={
          score.severity
            ? SEVERITY_COLORS[score.severity] ?? 'hollow'
            : 'hollow'
        }
      >
        {label}
      </EuiBadge>
    </EuiToolTip>
  );
};

/** The value in monospace, broken anywhere, with a copy button. Never a link. */
export const CopyableValue: React.FC<{
  value: string;
  'data-test-subj'?: string;
}> = ({ value, 'data-test-subj': dataTestSubj }) => (
  <EuiFlexGroup gutterSize='xs' alignItems='center' responsive={false}>
    <EuiFlexItem className='ctiCatalog__value' data-test-subj={dataTestSubj}>
      <code>{value}</code>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiCopy textToCopy={value}>
        {copy => (
          <EuiButtonIcon
            iconType='copyClipboard'
            onClick={copy}
            aria-label={i18n.translate('wazuhCheckUpdates.ctiCatalog.copy', {
              defaultMessage: 'Copy value',
            })}
          />
        )}
      </EuiCopy>
    </EuiFlexItem>
  </EuiFlexGroup>
);

/**
 * A link from third-party content. Only web URLs become links, and they open
 * in a new tab without the referrer; anything else is shown as text.
 */
export const ExternalReference: React.FC<{ url: string }> = ({ url }) =>
  isWebUrl(url) ? (
    <EuiLink href={url} target='_blank' external rel='noopener noreferrer'>
      {url}
    </EuiLink>
  ) : (
    <code className='ctiCatalog__value'>{url}</code>
  );

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

/**
 * Horizontal bars, one per value, relative to the largest. With `onSelect`,
 * each row filters the browser below; the selected one is highlighted.
 */
export const BreakdownList: React.FC<{
  items: BreakdownItem[];
  selected?: string;
  onSelect?: (key: string) => void;
  selectLabel?: (label: string) => string;
  'data-test-subj'?: string;
}> = ({
  items,
  selected,
  onSelect,
  selectLabel,
  'data-test-subj': dataTestSubj,
}) => {
  const max = Math.max(1, ...items.map(item => item.count));
  return (
    <ul className='ctiCatalog__breakdown' data-test-subj={dataTestSubj}>
      {items.map(item => {
        const content = (
          <>
            <EuiFlexGroup
              gutterSize='s'
              justifyContent='spaceBetween'
              responsive={false}
            >
              <EuiFlexItem className='ctiCatalog__breakdownLabel'>
                <EuiText size='s'>{item.label}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size='s' color='subdued'>
                  {numberFormat.format(item.count)}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiProgress
              value={item.count}
              max={max}
              size='s'
              color={selected === item.key ? 'accent' : 'primary'}
              aria-hidden
            />
          </>
        );
        return (
          <li key={item.key}>
            {onSelect ? (
              <button
                type='button'
                className={`ctiCatalog__breakdownRow ${
                  selected === item.key
                    ? 'ctiCatalog__breakdownRow--selected'
                    : ''
                }`}
                onClick={() => onSelect(item.key)}
                aria-pressed={selected === item.key}
                aria-label={selectLabel?.(item.label)}
                data-test-subj={`${dataTestSubj}-${item.key}`}
              >
                {content}
              </button>
            ) : (
              <div className='ctiCatalog__breakdownRow'>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

/** Removable chip for one active browse filter. */
export const FilterChip: React.FC<{
  label: string;
  onRemove: () => void;
  'data-test-subj'?: string;
}> = ({ label, onRemove, 'data-test-subj': dataTestSubj }) => (
  <EuiBadge
    color='hollow'
    iconType='cross'
    iconSide='right'
    iconOnClick={onRemove}
    iconOnClickAriaLabel={i18n.translate(
      'wazuhCheckUpdates.ctiCatalog.filter.remove',
      { defaultMessage: 'Remove filter {label}', values: { label } },
    )}
    data-test-subj={dataTestSubj}
  >
    {label}
  </EuiBadge>
);

/** Explains that browsing stops at the page cap, so totals are not misread. */
export const PageCapNote: React.FC<{ total: number; shown: number }> = ({
  total,
  shown,
}) =>
  total > shown ? (
    <EuiText size='xs' color='subdued'>
      {i18n.translate('wazuhCheckUpdates.ctiCatalog.pageCap', {
        defaultMessage:
          'Browsing reaches the newest {shown} of {total} records. Narrow the filters to see older ones.',
        values: {
          shown: numberFormat.format(shown),
          total: numberFormat.format(total),
        },
      })}
    </EuiText>
  ) : null;

export const RefreshButton: React.FC<{
  onClick: () => void;
  isLoading: boolean;
  'data-test-subj'?: string;
}> = ({ onClick, isLoading, 'data-test-subj': dataTestSubj }) => (
  <EuiButtonEmpty
    size='s'
    iconType='refresh'
    onClick={onClick}
    isLoading={isLoading}
    data-test-subj={dataTestSubj}
  >
    {i18n.translate('wazuhCheckUpdates.ctiCatalog.refresh', {
      defaultMessage: 'Refresh',
    })}
  </EuiButtonEmpty>
);
