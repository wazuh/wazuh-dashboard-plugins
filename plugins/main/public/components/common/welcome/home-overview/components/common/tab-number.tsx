import React from 'react';
import { formatUINumber } from '../../../../../../react-services/format-number';

export interface TabNumberProps {
  value: number;
}

export const TabNumber: React.FC<TabNumberProps> = ({ value }) => (
  <span className='tab-num'>{formatUINumber(value)}</span>
);
