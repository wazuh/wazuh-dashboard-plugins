import React from 'react';
import { EuiCallOut } from '@elastic/eui';

export default function PermissionsAdvice() {
  return (
    <EuiCallOut
      color='danger'
      title='This section could not be displayed because you do not have permission to get access to the registration service.'
      iconType='iInCircle'
    />
  );
}
