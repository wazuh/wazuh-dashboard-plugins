import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export interface HostOSProps {
  os: {
    name: string;
    platform: string;
    full: string;
  };
}

export const HostOS = ({ os }: HostOSProps) => {
  let icon = '';
  if (os?.platform === 'linux') {
    icon = 'linux';
  } else if (os?.platform === 'windows') {
    icon = 'windows';
  } else if (os?.platform === 'darwin') {
    icon = 'apple';
  }

  return (
    <EuiFlexGroup gutterSize='xs' responsive={false} wrap={false}>
      <EuiFlexItem grow={false}>
        <i
          className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
          aria-hidden='true'
        ></i>
      </EuiFlexItem>{' '}
      <EuiFlexItem>{os?.full || '-'}</EuiFlexItem>
    </EuiFlexGroup>
  );
};
