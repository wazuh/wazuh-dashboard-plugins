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
  EuiButtonIcon,
  EuiLink,
  EuiToolTip
} from '@elastic/eui';

export const WzButtonPermissions = ({permissions, buttonType = 'default', tooltip, ...rest}) => {
  const [userPermissionRequirements, userPermissions] = useUserPermissionsValidation(typeof permissions === 'function' ? permissions(rest) : permissions);

  const Button = buttonType === 'default' ? EuiButton
    : buttonType === 'empty' ? EuiButtonEmpty 
    : buttonType === 'icon' ? EuiButtonIcon 
    : buttonType === 'link' ? EuiLink 
    : null
  const disabled = Boolean(userPermissionRequirements || rest.isDisabled);
  const disabledProp = buttonType !== 'link' ? { isDisabled: disabled } : { disabled };

  const button = <Button {...rest} {...disabledProp} onClick={(disabled || !rest.onClick) ? undefined : rest.onClick}/>
  
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