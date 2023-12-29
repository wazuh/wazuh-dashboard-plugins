/*
 * Wazuh app - Button with Wazuh API permissions and/or roles required to be useful
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
import { useUserPermissionsRequirements } from '../hooks/useUserPermissions';
import { useUserRolesRequirements } from '../hooks/useUserRoles';

import { EuiToolTip, EuiSpacer } from '@elastic/eui';

import { WzPermissionsFormatted } from './format';

export interface IUserPermissionsObject {
  action: string;
  resource: string;
}
export type TUserPermissionsFunction = (props: any) => TUserPermissions;
export type TUserPermissions = (string | IUserPermissionsObject)[] | null;
export type TUserRoles = string[] | null;
export type TUserRolesFunction = (props: any) => TUserRoles;

export interface IWzElementPermissionsProps {
  permissions?: TUserPermissions | TUserPermissionsFunction;
  roles?: TUserRoles | TUserRolesFunction;
  tooltip?: any;
  children: React.ReactElement;
  getAdditionalProps?: (disabled: boolean) => {
    [prop: string]: any;
  };
}

export const WzElementPermissions = ({
  children,
  permissions = null,
  roles = null,
  getAdditionalProps,
  tooltip,
  ...rest
}: IWzElementPermissionsProps) => {
  const [userPermissionRequirements] = useUserPermissionsRequirements(
    typeof permissions === 'function' ? permissions(rest) : permissions,
  );
  const [userRolesRequirements] = useUserRolesRequirements(
    typeof roles === 'function' ? roles(rest) : roles,
  );

  const isDisabledByRolesOrPermissions =
    userRolesRequirements || userPermissionRequirements;

  const disabled = Boolean(
    isDisabledByRolesOrPermissions || rest?.isDisabled || rest?.disabled,
  );

  const additionalProps = getAdditionalProps
    ? getAdditionalProps(disabled)
    : {};

  const childrenWithAdditionalProps = React.cloneElement(children, {
    ...additionalProps,
  });

  const contentTextRequirements = isDisabledByRolesOrPermissions && (
    <Fragment>
      {userPermissionRequirements && (
        <div>
          <div>
            Require the{' '}
            {userPermissionRequirements.length === 1
              ? 'permission'
              : 'permissions'}
            :
          </div>
          {WzPermissionsFormatted(userPermissionRequirements)}
        </div>
      )}
      {userPermissionRequirements && userRolesRequirements && (
        <EuiSpacer size='s' />
      )}
      {userRolesRequirements && (
        <div>
          Require{' '}
          {userRolesRequirements
            .map(role => (
              <strong key={`empty-prompt-no-roles-${role}`}>{role}</strong>
            ))
            .reduce((prev, cur) => [prev, ', ', cur])}{' '}
          {userRolesRequirements.length > 1 ? 'roles' : 'role'}
        </div>
      )}
    </Fragment>
  );
  return isDisabledByRolesOrPermissions ? (
    <EuiToolTip {...tooltip} content={contentTextRequirements}>
      {childrenWithAdditionalProps}
    </EuiToolTip>
  ) : tooltip && tooltip.content ? (
    <EuiToolTip {...tooltip}>{childrenWithAdditionalProps}</EuiToolTip>
  ) : (
    childrenWithAdditionalProps
  );
};
