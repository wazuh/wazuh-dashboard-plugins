/*
 * Wazuh app - Button with Wazuh API permissions and/or roles required to be useful
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment } from 'react';
import { useUserPermissionsRequirements } from '../hooks/useUserPermissions';
import { useUserRolesRequirements } from '../hooks/useUserRoles';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiLink,
  EuiToolTip,
  EuiSpacer
} from '@elastic/eui';

export const WzButtonPermissions = ({permissions = null, roles = null, buttonType = 'default', tooltip, ...rest}) => {
  const [userPermissionRequirements, userPermissions] = useUserPermissionsRequirements(typeof permissions === 'function' ? permissions(rest) : permissions);
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(typeof roles === 'function' ? roles(rest) : roles);

  const Button = buttonType === 'default' ? EuiButton
    : buttonType === 'empty' ? EuiButtonEmpty 
    : buttonType === 'icon' ? EuiButtonIcon 
    : buttonType === 'link' ? EuiLink 
    : null
  const disabled = Boolean(userRolesRequirements || userPermissionRequirements || rest.isDisabled);
  const disabledProp = buttonType !== 'link' ? { isDisabled: disabled } : { disabled };

  const button = <Button {...rest} {...disabledProp} onClick={(disabled || !rest.onClick) ? undefined : rest.onClick}/>
  
  const buttonTextRequirements = (userRolesRequirements || userPermissionRequirements) && (
    <Fragment>
      {userPermissionRequirements && (
        <div>
          Require {userPermissionRequirements.map(permission => typeof permission === 'object' ? permission.action : permission).join(', ')} {userPermissionRequirements.length > 1 ? 'permissions': 'permission'}
        </div>
      )}
      {(userPermissionRequirements && userRolesRequirements) && <EuiSpacer size='s' />}
      {userRolesRequirements && (
        <div>
          Require {userRolesRequirements.join(',')} {userRolesRequirements.length > 1 ? 'roles': 'role'}
        </div>
      )}
    </Fragment>
  )
  return (userRolesRequirements || userPermissionRequirements) ? 
    (<EuiToolTip
      {...tooltip}
      content={buttonTextRequirements}
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