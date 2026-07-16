import React from 'react';
import { EuiStat, EuiStatProps } from '@elastic/eui';

export interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
  /** A color token or hex string for the value. */
  color?: string;
  textAlign?: EuiStatProps['textAlign'];
  titleSize?: EuiStatProps['titleSize'];
  ['data-test-subj']?: string;
}

/** Thin wrapper over EuiStat for a KPI/stat tile (models `vuls_severity_stat`). */
export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  color,
  textAlign = 'center',
  titleSize = 'l',
  ...rest
}) => (
  <EuiStat
    title={value}
    description={label}
    titleColor={color as EuiStatProps['titleColor']}
    textAlign={textAlign}
    titleSize={titleSize}
    data-test-subj={rest['data-test-subj']}
  />
);
