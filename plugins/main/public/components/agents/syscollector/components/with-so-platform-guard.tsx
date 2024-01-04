import React from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiIcon, EuiPanel } from '@elastic/eui';

export const withSOPlatformGuard = WrappedComponent => props => {
  const { soPlatform } = props;
  if (!soPlatform) {
    return (
      <EuiPanel
        style={{ display: 'flex' }}
        className='wz-agent-inventory-panel'
      >
        <EuiFlexGroup
          direction='column'
          alignItems='center'
          justifyContent='center'
        >
          <EuiFlexItem grow={false}>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type='iInCircle' />
              <span>Not enough hardware or operating system information</span>
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
  return <WrappedComponent {...props} />;
};
