import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export const ConfigurationsInfo = props => {
  const { keyValue, value } = props;
  return (
    <>
      <EuiFlexGroup component='span' className='wz-padding-top-5'>
        <EuiFlexItem component='span' style={{ width: '25%' }}>
          {keyValue}
        </EuiFlexItem>
        <EuiFlexItem component='span' className='color-grey'>
          {String(value)}
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
