import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { EuiListGroup } from '@elastic/eui';
import './legend.scss';
import { formatUINumber } from '../../../../react-services/format-number';

type ChartLegendProps = {
  data: {
    label: string;
    value: any;
    color: string;
    labelColor: string;
  }[];
};

/**
 * Create the legend to use with charts in visualizations.
 */
export function ChartLegend({ data }: ChartLegendProps) {
  const list = data.map(({ label, labelColor, value, ...rest }, idx) => ({
    label: (
      <div
        style={{
          fontSize: '0.875rem',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}
      >{`${label} (${formatUINumber(value)})`}</div>
    ),
    icon: <EuiIcon type='dot' size='l' color={labelColor} />,
    ...rest,
  }));

  return (
    <EuiListGroup
      className='chart-legend'
      listItems={list}
      color='text'
      flush
    />
  );
}
