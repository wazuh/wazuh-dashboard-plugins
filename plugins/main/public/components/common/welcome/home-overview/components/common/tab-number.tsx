import React from 'react';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { VALUE_PLACEHOLDER } from '../../lib/constants';

export interface TabNumberProps {
  value?: number;
}

export const TabNumber: React.FC<TabNumberProps> = ({ value }) => (
  <span className='tab-num'>
    {value === undefined ? VALUE_PLACEHOLDER : formatUINumber(value)}
  </span>
);

export const formatValueSafely = (value?: number): string =>
  value === undefined ? VALUE_PLACEHOLDER : formatUINumber(value);
