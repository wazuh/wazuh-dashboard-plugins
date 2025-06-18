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

  switch (os?.platform) {
    case 'linux': {
      icon = 'linux';

      break;
    }

    case 'windows': {
      icon = 'windows';

      break;
    }

    case 'darwin': {
      icon = 'apple';

      break;
    }
    // No default
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
