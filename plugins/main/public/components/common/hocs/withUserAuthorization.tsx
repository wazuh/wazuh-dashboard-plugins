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

import React from 'react';
import { useUserPermissionsRequirements } from '../hooks/useUserPermissions';
import { useUserPermissionsIsAdminRequirements } from '../hooks/use-user-is-admin';
import { WzEmptyPromptNoPermissions } from '../permissions/prompt';
import { compose } from 'redux';
import { withUserLogged } from './withUserLogged';
//
const withUserAuthorizationPromptChanged =
  (permissions = null, othersPermissions = { isAdmininistrator: null }) =>
  WrappedComponent =>
  props => {
    const [userPermissionRequirements, userPermissions] =
      useUserPermissionsRequirements(
        typeof permissions === 'function' ? permissions(props) : permissions,
      );
    const [_userPermissionIsAdminRequirements] =
      useUserPermissionsIsAdminRequirements();

    const userPermissionIsAdminRequirements =
      othersPermissions?.isAdmininistrator
        ? _userPermissionIsAdminRequirements
        : null;

    return userPermissionRequirements || userPermissionIsAdminRequirements ? (
      <WzEmptyPromptNoPermissions
        permissions={userPermissionRequirements}
        administrator={userPermissionIsAdminRequirements}
      />
    ) : (
      <WrappedComponent {...props} />
    );
  };

export const withUserAuthorizationPrompt =
  (permissions = null, othersPermissions = { isAdmininistrator: null }) =>
  WrappedComponent =>
    compose(
      withUserLogged,
      withUserAuthorizationPromptChanged(permissions, othersPermissions),
    )(WrappedComponent);
