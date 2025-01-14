import React from 'react';
import { EuiStat, EuiStatProps } from '@elastic/eui';
import { formatUINumber } from '../../../../../react-services/format-number';

type VulsSeverityStatProps = {
  value: string;
  color: string;
  textAlign?: EuiStatProps['textAlign'];
  statElement?: EuiStatProps['descriptionElement'];
  isLoading: boolean;
};

export default function VulsSeverityStat({
  value,
  color,
  textAlign = 'center',
  statElement = 'h2',
  isLoading,
}: VulsSeverityStatProps) {
  return (
    <EuiStat
      className='vuls-severity-stat'
      title={value}
      description={''}
      titleElement={statElement}
      isLoading={isLoading}
      titleColor={color}
      titleSize='m'
      textAlign={textAlign}
    />
  );
}
