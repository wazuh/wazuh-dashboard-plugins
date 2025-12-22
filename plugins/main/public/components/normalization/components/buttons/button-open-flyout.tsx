import React from 'react';
import { WzButtonPermissionsOpenFlyout } from '../../../common/buttons';

export const ButtonOpenFlyout = props => (
  <WzButtonPermissionsOpenFlyout
    {...props}
    flyoutProps={{
      style: {
        maxWidth: '1000px',
        width: '60%',
      },
    }}
  ></WzButtonPermissionsOpenFlyout>
);
