import React from 'react';
import { EuiBadge } from '@elastic/eui';

export const WzSearchBarCustomFilter = ({ children }) => (
  <EuiBadge color='hollow' className='globalFilterItem'>
    {children}
  </EuiBadge>
);
