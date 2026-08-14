import React from 'react';
import { EuiStat, EuiStatProps } from '@elastic/eui';
import { HOME_OVERVIEW_TEXT_COLOR } from '../../lib/theme-colors';

export interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
  color?: string;
  textAlign?: EuiStatProps['textAlign'];
  titleSize?: EuiStatProps['titleSize'];
  /** Value before label; aligns numbers across a multi-tile row. */
  reverse?: boolean;
  className?: string;
  ['data-test-subj']?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  color = HOME_OVERVIEW_TEXT_COLOR.text,
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
