/*
 * Wazuh app - React hook for get query of Kibana searchBar
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { useUserPermissionsValidation } from '../hooks/useUserPermissions';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiToolTip
} from '@elastic/eui';

export const WzButtonPermissions = ({permissions, buttonType = 'default', tooltip, ...rest}) => {
  const [userPermissionRequirements, userPermissions] = useUserPermissionsValidation(typeof permissions === 'function' ? permissions(rest) : permissions);
  const Button = buttonType === 'default' ? EuiButton
    : 'empty' ? EuiButtonEmpty 
    : null
  const button = <Button {...rest} isDisabled={Boolean(userPermissionRequirements || rest.isDisabled)}/>
  return userPermissionRequirements ? 
  (<EuiToolTip
    {...tooltip}
    content={`Require ${userPermissionRequirements.map(permission => typeof permission === 'object' ? permission.action : permission).join(', ')} ${userPermissionRequirements.length > 1 ? 'permissions': 'permission'}`}
  >
    {button}
  </EuiToolTip>) : tooltip && tooltip.content ? 
  (<EuiToolTip
    {...tooltip}
  >
    {button}
  </EuiToolTip>)
  : button
}