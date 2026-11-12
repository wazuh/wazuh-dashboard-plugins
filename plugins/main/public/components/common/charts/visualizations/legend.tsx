import React from 'react';
import {
  EuiIcon,
  EuiListGroup,
  EuiScreenReaderOnly,
  EuiToolTip,
} from '@elastic/eui';
import './legend.scss';
import { formatUINumber } from '../../../../react-services/format-number';

type ChartLegendProps = {
  data: {
    label: string;
    value: any;
    color: string;
    labelColor: string;
    description?: string;
    onClick?: () => void;
  }[];
};

/**
 * Create the legend to use with charts in visualizations.
 */
export function ChartLegend({ data }: ChartLegendProps) {
  const list = data.map(
    ({ label, labelColor, value, description, ...rest }) => {
      const text = (
        <div
          style={{
            fontSize: '0.875rem',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >{`${label} (${formatUINumber(value)})`}</div>
      );
      return {
        label: description ? (
          <>
            <EuiToolTip position='top' title={label} content={description}>
              {text}
            </EuiToolTip>
            <EuiScreenReaderOnly>
              <span>{description}</span>
            </EuiScreenReaderOnly>
          </>
        ) : (
          text
        ),
        icon: <EuiIcon type='dot' size='l' color={labelColor} />,
        // wrapText drops the native title, which would cover the tooltip
        wrapText: Boolean(description),
        ...rest,
      };
    },
  );

  return (
    <EuiListGroup
      className='chart-legend'
      listItems={list}
      color='text'
      flush
    />
  );
}
