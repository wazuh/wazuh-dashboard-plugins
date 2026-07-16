import React from 'react';
import { EuiStat, EuiStatProps } from '@elastic/eui';

export interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
  /** A color token or hex string for the value. */
  color?: string;
  textAlign?: EuiStatProps['textAlign'];
  titleSize?: EuiStatProps['titleSize'];
  /** Render the value before the label. Use in multi-tile rows where labels
   * can wrap to different line counts — with the value first, every tile's
   * number lands at the same vertical position regardless of its own
   * label's line count. */
  reverse?: boolean;
  ['data-test-subj']?: string;
}

/** Thin wrapper over EuiStat for a KPI/stat tile (models `vuls_severity_stat`). */
export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  color,
  textAlign = 'center',
  titleSize = 'l',
  reverse = false,
  ...rest
}) => (
  <EuiStat
    title={value}
    description={label}
    titleColor={color as EuiStatProps['titleColor']}
    textAlign={textAlign}
    titleSize={titleSize}
    reverse={reverse}
    data-test-subj={rest['data-test-subj']}
  />
);
