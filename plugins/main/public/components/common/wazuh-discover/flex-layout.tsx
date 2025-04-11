import React from 'react';
import './flex-layout.scss';

export const WzTableFlexGroup = ({ children }) => {
  return (
    <div className='wz-table-flex-row wz-table-flex-row-gutter-size-s wz-table-flex-row-grow-height'>
      {children}
    </div>
  );
};

export const WzTableFlexItem = ({ children }) => {
  return <div className='wz-table-flex-item'>{children}</div>;
};
