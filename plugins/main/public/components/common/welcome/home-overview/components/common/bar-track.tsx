import React from 'react';
import { EuiText } from '@elastic/eui';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { HOME_OVERVIEW_CHROME } from '../../lib/theme-colors';

/** Height of every proportional bar (distribution, dual, gauge). */
export const BAR_HEIGHT = 10;

/** The colored square every legend entry starts with. */
const LegendDot: React.FC<{ color: string }> = ({ color }) => (
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

export interface LegendItemProps {
  color: string;
  label: React.ReactNode;
  /** Omitted by legends that only name the colors (e.g. Passed/Failed). */
  count?: number;
}

export const LegendItem: React.FC<LegendItemProps> = ({
  color,
  label,
  count,
}) => (
  <EuiText
    size='xs'
    color='subdued'
    style={{ display: 'inline-flex', alignItems: 'center' }}
  >
    <LegendDot color={color} />
    <span>{label}</span>
    {count !== undefined && (
      <strong className='tab-num' style={{ color: 'inherit', marginLeft: 4 }}>
        {formatUINumber(count)}
      </strong>
    )}
  </EuiText>
);

/** The track a proportional bar's segments sit in. */
export const BarTrack: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      display: 'flex',
      height: BAR_HEIGHT,
      borderRadius: 4,
      overflow: 'hidden',
      background: HOME_OVERVIEW_CHROME.trackBackground,
    }}
  >
    {children}
  </div>
);
