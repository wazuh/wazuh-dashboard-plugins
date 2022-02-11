/*
 * Wazuh app - React HOCs to manage user authorization requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from "react";
import { useUserPermissions, useUserPermissionsRequirements, useUserPermissionsPrivate } from '../hooks/useUserPermissions';
import { useUserRoles, useUserRolesRequirements, useUserRolesPrivate } from '../hooks/useUserRoles';
import { WzEmptyPromptNoPermissions } from '../permissions/prompt';
import { compose } from 'redux';
import { withUserLogged } from './withUserLogged'
 //
 const withUserAuthorizationPromptChanged = (permissions = null, roles = null) => WrappedComponent => props => {
  const [userPermissionRequirements, userPermissions] = useUserPermissionsRequirements(typeof permissions === 'function' ? permissions(props) : permissions);
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(typeof roles === 'function' ? roles(props) : roles);

  return (userPermissionRequirements || userRolesRequirements) ? <WzEmptyPromptNoPermissions permissions={userPermissionRequirements} roles={userRolesRequirements} /> : <WrappedComponent {...props} />;
}

export const withUserAuthorizationPrompt =  (permissions = null, roles = null) => WrappedComponent => compose(
  withUserLogged,
  withUserAuthorizationPromptChanged(permissions,roles)
  )(WrappedComponent)
