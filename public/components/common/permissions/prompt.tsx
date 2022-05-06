/*
 * Wazuh app - Prompt component with the user required permissions and/or roles
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment } from 'react';
import { useUserPermissionsRequirements, useUserRolesRequirements } from '../hooks';
import { EuiEmptyPrompt, EuiSpacer } from '@elastic/eui';
import {
  TUserPermissions,
  TUserPermissionsFunction,
  TUserRoles,
  TUserRolesFunction,
} from '../permissions/button';
import { WzPermissionsFormatted } from './format';
import { withErrorBoundary } from '../hocs/error-boundary/with-error-boundary';

interface IEmptyPromptNoPermissions {
  permissions?: TUserPermissions;
  roles?: TUserRoles;
  actions?: React.ReactNode;
}
export const WzEmptyPromptNoPermissions = withErrorBoundary(
  ({ permissions, roles, actions }: IEmptyPromptNoPermissions) => {
    return (
      <EuiEmptyPrompt
        iconType="securityApp"
        title={<h2>You have no permissions</h2>}
        body={
          <Fragment>
            {permissions && (
              <div>
                This section requires the {permissions.length > 1 ? 'permissions' : 'permission'}:
                {WzPermissionsFormatted(permissions)}
              </div>
            )}
            {permissions && roles && <EuiSpacer />}
            {roles && (
              <div>
                This section requires{' '}
                {roles
                  .map((role) => <strong key={`empty-prompt-no-roles-${role}`}>{role}</strong>)
                  .reduce((accum, cur) => [accum, ', ', cur])}{' '}
                {roles.length > 1 ? 'roles' : 'role'}
              </div>
            )}
          </Fragment>
        }
        actions={actions}
      />
    );
  }
);
interface IPromptNoPermissions {
  permissions?: TUserPermissions | TUserPermissionsFunction;
  roles?: TUserRoles | TUserRolesFunction;
  children?: React.ReactNode;
  rest?: any;
}

export const WzPromptPermissions = ({
  permissions = null,
  roles = null,
  children,
  ...rest
}: IPromptNoPermissions) => {
  const [userPermissionRequirements, userPermissions] = useUserPermissionsRequirements(
    typeof permissions === 'function' ? permissions(rest) : permissions
  );
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(
    typeof roles === 'function' ? roles(rest) : roles
  );

  return userPermissionRequirements || userRolesRequirements ? (
    <WzEmptyPromptNoPermissions
      permissions={userPermissionRequirements}
      roles={userRolesRequirements}
    />
  ) : (
    children
  );
};
