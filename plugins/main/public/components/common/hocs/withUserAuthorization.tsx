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
import {
  withSelectedServerAPI,
  withServerAPIAvailable,
} from './with-server-api-available';

interface ActionResourcePermission {
  action: string;
  resource: string;
}

type ActionResourcePermissionRequirements =
  | ActionResourcePermission[][]
  | ActionResourcePermission[];

interface PermissionResolver {
  (params: any): ActionResourcePermissionRequirements;
}

type AccessPermission =
  | ActionResourcePermissionRequirements
  | PermissionResolver
  | null;

interface ExtraUserPermissions {
  isAdmininistrator?: boolean | null;
}

const withUserAuthorizationPromptChanged =
  (
    permissions: AccessPermission = null,
    extraUserPermissions: ExtraUserPermissions = { isAdmininistrator: null },
  ) =>
  (WrappedComponent: React.FC) =>
  (props: any) => {
    const [userPermissionRequirements] = useUserPermissionsRequirements(
      typeof permissions === 'function' ? permissions(props) : permissions,
    );
    const [_userPermissionIsAdminRequirements] =
      useUserPermissionsIsAdminRequirements();

    const userPermissionIsAdminRequirements =
      extraUserPermissions?.isAdmininistrator
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
  (
    permissions: AccessPermission = null,
    extraPermissions: ExtraUserPermissions = { isAdmininistrator: null },
  ) =>
  (WrappedComponent: React.FC) =>
    compose(
      withUserLogged,
      withSelectedServerAPI,
      withServerAPIAvailable,
      withUserAuthorizationPromptChanged(permissions, extraPermissions),
    )(WrappedComponent);
