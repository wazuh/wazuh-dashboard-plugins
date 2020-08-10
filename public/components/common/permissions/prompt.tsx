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

import React, { Fragment } from 'react';
import { useUserPermissionsRequirements } from '../hooks/useUserPermissions';
import { useUserRolesRequirements } from '../hooks/useUserRoles';
import { EuiEmptyPrompt, EuiSpacer, EuiPanel } from '@elastic/eui';
import { TUserPermissions, TUserPermissionsFunction, TUserRoles, TUserRolesFunction } from '../permissions/button';

interface IEmptyPromptNoPermissions{
  permissions?: TUserPermissions
  roles?: TUserRoles
  actions?: React.ReactNode
}

export const WzEmptyPromptNoPermissions = ({permissions, roles, actions}: IEmptyPromptNoPermissions) => {
  const prompt = (<EuiEmptyPrompt
    iconType="securityApp"
    title={<h2>You have no permissions</h2>}
    body={
      <Fragment>
        {permissions && (
          <p>
            This section requires {permissions.map(permission => (<strong key={`empty-prompt-no-permissions-${typeof permission === 'object' ? permission.action : permission}`}>{typeof permission === 'object' ? permission.action : permission}</strong>)).reduce((accum, cur) => [accum, ', ', cur])} {permissions.length > 1 ? 'permissions' : 'permission'}
          </p>
        )}
        {permissions && roles && (<EuiSpacer />)}
        {roles && (
          <p>
            This section requires {roles.map(role => (<strong key={`empty-prompt-no-permissions-${role}`}>{role}</strong>)).reduce((accum, cur) => [accum, ', ', cur])} {roles.length > 1 ? 'roles' : 'role'}
          </p>
        )}
      </Fragment>
    }
    actions={actions}
  />)
  return (
  // <EuiPanel>{prompt}</EuiPanel>
  prompt
  )
}

interface IPromptNoPermissions{
  permissions?: TUserPermissions | TUserPermissionsFunction
  roles?: TUserRoles | TUserRolesFunction
  children?: React.ReactNode
  rest?: any
}

export const WzPromptPermissions = ({permissions = null, roles = null, children, ...rest} : IPromptNoPermissions) => {
  const [userPermissionRequirements, userPermissions] = useUserPermissionsRequirements(typeof permissions === 'function' ? permissions(rest) : permissions);
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(typeof roles === 'function' ? roles(rest) : roles);

  return (userPermissionRequirements || userRolesRequirements) ? <WzEmptyPromptNoPermissions permissions={userPermissionRequirements} roles={userRolesRequirements} /> : children;
}