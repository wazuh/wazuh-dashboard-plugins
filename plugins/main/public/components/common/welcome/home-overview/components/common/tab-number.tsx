import React from 'react';
import { EuiIcon, EuiToolTip } from '@elastic/eui';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { VALUE_PLACEHOLDER } from '../../lib/constants';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

export interface TabNumberProps {
  value?: number;
  errorTooltip?: string;
  errorColor?: 'danger' | 'warning';
  infoTooltip?: string;
}

export const ErrorValuePlaceholder: React.FC<{
  tooltip?: string;
  color?: 'danger' | 'warning';
}> = ({ tooltip = 'Could not load data', color = 'danger' }) => (
  <EuiToolTip position='top' content={tooltip}>
    <span className='tab-num' style={{ color: UI_COLOR_STATUS[color] }}>
      {VALUE_PLACEHOLDER} <EuiIcon type='alert' size='s' color={color} />
    </span>
  </EuiToolTip>
);

export const TabNumber: React.FC<TabNumberProps> = ({
  value,
  errorTooltip,
  errorColor,
  infoTooltip,
}) => {
  if (value === undefined && errorTooltip) {
    return <ErrorValuePlaceholder tooltip={errorTooltip} color={errorColor} />;
  }
  if (value === undefined && infoTooltip) {
    return (
      <EuiToolTip position='top' content={infoTooltip}>
        <span className='tab-num'>{VALUE_PLACEHOLDER}</span>
      </EuiToolTip>
    );
  }
  return (
    <span className='tab-num'>
      {value === undefined ? VALUE_PLACEHOLDER : formatUINumber(value)}
    </span>
  );
};

export const formatValueSafely = (value?: number): string =>
  value === undefined ? VALUE_PLACEHOLDER : formatUINumber(value);
