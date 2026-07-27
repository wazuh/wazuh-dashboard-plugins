import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { EmptyState } from './empty-state';
import { WIDGET_LOADING_MIN_HEIGHT } from './widget-group';

export interface DistributionBarSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  /** Present only for a clickable segment; navigates via href. */
  href?: string;
  /** Present only for a clickable segment; navigates via callback. */
  onClick?: () => void;
  tooltip?: React.ReactNode;
}

export interface DistributionBarProps {
  segments: DistributionBarSegment[];
  /** Sentence above the bar, e.g. "2,628 findings — 100% High severity". */
  headline?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

const BAR_HEIGHT = 10;

/** A small colored square used by every legend (distribution bars, dual bars). */
export const LegendDot: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: 2,
      background: color,
      marginRight: 6,
      flexShrink: 0,
    }}
  />
);

/**
 * A single proportional stacked bar (one segment per category) with a
 * dot-legend below — the shared visual for any "counts by category"
 * breakdown (agent status, severity distribution, ...). Segments with a
 * `href`/`onClick` stay navigable in the legend, same as the tiles/tables
 * this replaces.
 */
export const DistributionBar: React.FC<DistributionBarProps> = ({
  segments,
  headline,
  emptyMessage,
  ...rest
}) => {
  const testSubj = rest['data-test-subj'];

  if (segments.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
        data-test-subj={testSubj}
      />
    );
  }

  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  const renderLegendItem = (segment: DistributionBarSegment) => {
    const content = (
      <EuiText
        size='xs'
        color='subdued'
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <LegendDot color={segment.color} />
        <span>{segment.label}</span>
        <strong className='tab-num' style={{ color: 'inherit', marginLeft: 4 }}>
          {formatUINumber(segment.count)}
        </strong>
      </EuiText>
    );

    if (!segment.href && !segment.onClick) {
      return content;
    }

    return (
      <RedirectAppLinks application={getCore().application}>
        <EuiLink
          href={segment.href}
          onClick={segment.onClick}
          color='text'
          data-test-subj={testSubj ? `${testSubj}-${segment.key}` : undefined}
        >
          {content}
        </EuiLink>
      </RedirectAppLinks>
    );
  };

  return (
    <div data-test-subj={testSubj}>
      {headline && (
        <EuiText size='s' style={{ marginBottom: 8 }}>
          {headline}
        </EuiText>
      )}
      <div
        style={{
          display: 'flex',
          height: BAR_HEIGHT,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(128, 128, 128, 0.15)',
        }}
      >
        {segments
          .filter(segment => segment.count > 0)
          .map(segment => (
            // The width% must live on the flex item itself; EuiToolTip's own
            // wrapper element is not a flex item, so it can't carry the size.
            <div
              key={segment.key}
              style={{
                width: `${total > 0 ? (segment.count / total) * 100 : 0}%`,
                height: '100%',
              }}
            >
              <EuiToolTip
                position='top'
                content={
                  segment.tooltip ??
                  `${segment.label}: ${formatUINumber(segment.count)}`
                }
                display='block'
              >
                <div
                  style={{
                    width: '100%',
                    height: BAR_HEIGHT,
                    background: segment.color,
                  }}
                />
              </EuiToolTip>
            </div>
          ))}
      </div>
      <EuiFlexGroup
        gutterSize='m'
        wrap
        responsive={false}
        style={{ marginTop: 10 }}
      >
        {segments.map(segment => (
          <EuiFlexItem grow={false} key={segment.key}>
            {renderLegendItem(segment)}
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
