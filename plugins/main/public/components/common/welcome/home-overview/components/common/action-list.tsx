import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiLink,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { EmptyState } from './empty-state';
import {
  MoreItemsNote,
  TOP_N_ROW_HEIGHT,
  getMissingSlots,
} from './list-chrome';
import { HOME_OVERVIEW_CHROME } from '../../lib/theme-colors';
import { NON_TITLE_LINK_STYLE } from '../../lib/constants';

export interface ActionListItem {
  key: string;
  label: string;
  href?: string;
  /** Status dot before the label, with its meaning as a tooltip. */
  dot: { color: string; label: string };
  /** Right-aligned details, e.g. a count or a date. */
  end?: React.ReactNode;
}

export interface ActionListProps {
  title: React.ReactNode;
  /** What the list holds, shown as an info tooltip after the title. */
  titleTooltip?: string;
  /** Subdued note after the title, e.g. "· 4 more". */
  titleNote?: React.ReactNode;
  /** One action for the whole list, right of the title. */
  action?: React.ReactNode;
  items: ActionListItem[];
  /** Rows the list always takes; empty slots keep their height. */
  slots: number;
  emptyMessage: React.ReactNode;
  /** `EmptyState` icon; a check when an empty list is good news. */
  emptyIconType?: string;
  ['data-test-subj']?: string;
}

/**
 * A short list of things to act on: a dot, a linked label and right-aligned details per row. It
 * keeps the height of its slots with the Home list patterns: `EmptyState` when there is nothing,
 * `MoreItemsNote` when half of the slots are empty.
 */
export const ActionList: React.FC<ActionListProps> = ({
  title,
  titleTooltip,
  titleNote,
  action,
  items,
  slots,
  emptyMessage,
  emptyIconType,
  ...rest
}) => {
  const testSubj = rest['data-test-subj'];
  const missingSlots = getMissingSlots(items.length, slots);

  return (
    <div data-test-subj={testSubj}>
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='center'
        gutterSize='s'
        responsive={false}
        style={{ minHeight: 24 }}
      >
        <EuiFlexItem grow={false}>
          <EuiText size='xs'>
            <strong
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {title}
              {titleTooltip && (
                <EuiIconTip
                  type='iInCircle'
                  color='subdued'
                  size='s'
                  content={titleTooltip}
                />
              )}
              {titleNote && (
                <span
                  style={{ fontWeight: 'normal' }}
                  className='euiTextColor--subdued'
                >
                  {titleNote}
                </span>
              )}
            </strong>
          </EuiText>
        </EuiFlexItem>
        {action && <EuiFlexItem grow={false}>{action}</EuiFlexItem>}
      </EuiFlexGroup>
      <div style={{ marginTop: 4 }}>
        {items.length === 0 ? (
          <EmptyState
            message={emptyMessage}
            iconType={emptyIconType}
            minHeight={slots * TOP_N_ROW_HEIGHT}
            data-test-subj={testSubj ? `${testSubj}-empty` : undefined}
          />
        ) : (
          items.slice(0, slots).map((item, index) => (
            <div
              key={item.key}
              data-test-subj={testSubj ? `${testSubj}-row` : undefined}
              style={{
                display: 'grid',
                gridTemplateColumns: '8px minmax(0, 1fr) auto',
                columnGap: 12,
                alignItems: 'center',
                padding: '6px 0',
                borderTop:
                  index === 0 ? HOME_OVERVIEW_CHROME.hairline : undefined,
                borderBottom: HOME_OVERVIEW_CHROME.hairline,
              }}
            >
              <EuiToolTip content={item.dot.label}>
                <span
                  role='img'
                  aria-label={item.dot.label}
                  style={{
                    display: 'block',
                    width: 8,
                    height: 8,
                    borderRadius: 8,
                    background: item.dot.color,
                  }}
                />
              </EuiToolTip>
              <EuiText size='s' title={item.label} style={{ minWidth: 0 }}>
                {item.href ? (
                  <RedirectAppLinks
                    application={getCore().application}
                    className='eui-textTruncate'
                  >
                    <EuiLink href={item.href} style={NON_TITLE_LINK_STYLE}>
                      {item.label}
                    </EuiLink>
                  </RedirectAppLinks>
                ) : (
                  <span
                    className='eui-textTruncate'
                    style={{ display: 'block' }}
                  >
                    {item.label}
                  </span>
                )}
              </EuiText>
              <div style={{ whiteSpace: 'nowrap' }}>{item.end}</div>
            </div>
          ))
        )}
        {missingSlots.showNote && (
          <MoreItemsNote
            message={i18n.translate(
              'wazuh.common.homeOverviewList.noMoreItems',
              {
                defaultMessage: 'No more items to display',
              },
            )}
            missingSlots={missingSlots.count}
          />
        )}
      </div>
    </div>
  );
};
