import React from 'react';
import { EuiIcon, EuiToolTip } from '@elastic/eui';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { VALUE_PLACEHOLDER } from '../../lib/constants';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

export interface TabNumberProps {
  value?: number;
  errorTooltip?: string;
}

export const ErrorValuePlaceholder: React.FC<{ tooltip?: string }> = ({
  tooltip = 'Could not load data',
}) => (
  <EuiToolTip position='top' content={tooltip}>
    <span className='tab-num' style={{ color: UI_COLOR_STATUS.danger }}>
      {VALUE_PLACEHOLDER} <EuiIcon type='alert' size='s' color='danger' />
    </span>
  </EuiToolTip>
);

export const TabNumber: React.FC<TabNumberProps> = ({
  value,
  errorTooltip,
}) => {
  if (value === undefined && errorTooltip) {
    return <ErrorValuePlaceholder tooltip={errorTooltip} />;
  }
  return (
    <span className='tab-num'>
      {value === undefined ? VALUE_PLACEHOLDER : formatUINumber(value)}
    </span>
  );
};

export const formatValueSafely = (value?: number): string =>
  value === undefined ? VALUE_PLACEHOLDER : formatUINumber(value);
