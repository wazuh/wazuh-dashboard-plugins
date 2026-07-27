import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';
import { decimalFormat } from '../../../utils/helpers';

export interface ScoreGaugeZones {
  /** Fraction (0..1) of the track width; the three must sum to 1. */
  bad: number;
  warn: number;
  good: number;
}

export interface ScoreGaugeProps {
  /** Small caption above the gauge, e.g. "Overall score". */
  title?: React.ReactNode;
  /** Score as a fraction (0..1); undefined renders the track with no marker. */
  score?: number;
  zones?: ScoreGaugeZones;
  lowLabel?: string;
  highLabel?: string;
  ['data-test-subj']?: string;
}

const DEFAULT_ZONES: ScoreGaugeZones = { bad: 0.4, warn: 0.3, good: 0.3 };

/** Alpha-blended tint for a zone segment's background (kept readable in both themes). */
const zoneTint = (color: string) => `${color}2e`;

/**
 * A 0-100 score positioned on a threshold-zoned track (bad/warn/good), used
 * for posture-style scores (Configuration Assessment). No native EUI gauge
 * exists, so this is a small hand-built composition, same pattern as `BarList`.
 */
export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  title,
  score,
  zones = DEFAULT_ZONES,
  lowLabel = '0',
  highLabel = '100',
  ...rest
}) => {
  const hasScore = typeof score === 'number';
  const pct = hasScore
    ? Math.min(100, Math.max(0, (score as number) * 100))
    : 0;
  const badBoundary = zones.bad * 100;
  const warnBoundary = (zones.bad + zones.warn) * 100;
  const valueColor = !hasScore
    ? UI_COLOR_STATUS.disabled
    : pct < badBoundary
      ? UI_COLOR_STATUS.danger
      : pct < warnBoundary
        ? UI_COLOR_STATUS.warning
        : UI_COLOR_STATUS.success;

  return (
    <div data-test-subj={rest['data-test-subj']}>
      {title && (
        <EuiText size='xs' color='subdued'>
          <strong>{title}</strong>
        </EuiText>
      )}
      <div style={{ position: 'relative', margin: '22px 0 4px' }}>
        {hasScore && (
          <>
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                fontSize: 12.5,
                fontWeight: 700,
                color: valueColor,
                whiteSpace: 'nowrap',
              }}
            >
              {decimalFormat().convert(score as number)}
            </div>
            <div
              style={{
                position: 'absolute',
                top: -3,
                left: `${pct}%`,
                width: 3,
                height: 16,
                borderRadius: 2,
                background: valueColor,
                transform: 'translateX(-50%)',
              }}
            />
          </>
        )}
        <div
          style={{
            display: 'flex',
            height: 10,
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flexBasis: `${zones.bad * 100}%`,
              background: zoneTint(UI_COLOR_STATUS.danger),
            }}
          />
          <div
            style={{
              flexBasis: `${zones.warn * 100}%`,
              background: zoneTint(UI_COLOR_STATUS.warning),
            }}
          />
          <div
            style={{
              flexBasis: `${zones.good * 100}%`,
              background: zoneTint(UI_COLOR_STATUS.success),
            }}
          />
        </div>
        <EuiFlexGroup
          justifyContent='spaceBetween'
          responsive={false}
          style={{ marginTop: 2 }}
        >
          <EuiFlexItem grow={false}>
            <EuiText size='xs' color='subdued'>
              {lowLabel}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='xs' color='subdued'>
              {highLabel}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </div>
  );
};
