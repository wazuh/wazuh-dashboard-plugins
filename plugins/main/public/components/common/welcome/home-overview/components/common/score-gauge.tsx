import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';
import { decimalFormat } from '../../../utils/helpers';
import { BAR_HEIGHT } from './bar-track';

export interface ScoreGaugeProps {
  /** Small caption above the gauge, e.g. "Overall score". */
  title?: React.ReactNode;
  /** Score as a fraction (0..1); undefined renders the track with no marker. */
  score?: number;
  ['data-test-subj']?: string;
}

/** Share of the 0-100 track each threshold zone takes; they sum to 1. */
const ZONES = { bad: 0.4, warn: 0.3, good: 0.3 } as const;
const BAD_BOUNDARY = ZONES.bad * 100;
const WARN_BOUNDARY = (ZONES.bad + ZONES.warn) * 100;

/** Alpha-blended tint for a zone's background. */
const zoneTint = (color: string) => `${color}2e`;

const zoneColor = (pct: number) => {
  if (pct < BAD_BOUNDARY) {
    return UI_COLOR_STATUS.danger;
  }
  return pct < WARN_BOUNDARY
    ? UI_COLOR_STATUS.warning
    : UI_COLOR_STATUS.success;
};

/**
 * A 0-100 score marked on a threshold-zoned track (bad/warn/good). Hand-built
 * because EUI has no gauge.
 */
export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  title,
  score,
  ...rest
}) => {
  const pct =
    score === undefined ? undefined : Math.min(100, Math.max(0, score * 100));
  const valueColor =
    pct === undefined ? UI_COLOR_STATUS.disabled : zoneColor(pct);
  const formattedScore =
    score === undefined ? undefined : decimalFormat().convert(score);

  return (
    <div data-test-subj={rest['data-test-subj']}>
      {title && (
        <EuiText size='xs' color='subdued'>
          <strong>{title}</strong>
        </EuiText>
      )}
      <div style={{ position: 'relative', margin: '22px 0 4px' }}>
        {pct !== undefined && (
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
              {formattedScore}
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
            height: BAR_HEIGHT,
            borderRadius: BAR_HEIGHT / 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flexBasis: `${ZONES.bad * 100}%`,
              background: zoneTint(UI_COLOR_STATUS.danger),
            }}
          />
          <div
            style={{
              flexBasis: `${ZONES.warn * 100}%`,
              background: zoneTint(UI_COLOR_STATUS.warning),
            }}
          />
          <div
            style={{
              flexBasis: `${ZONES.good * 100}%`,
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
              0
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='xs' color='subdued'>
              100
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </div>
  );
};
