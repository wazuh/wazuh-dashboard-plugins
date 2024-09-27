import React from 'react';
import { ServerButtonPermissions } from './button';
import { ServerElementPermissions } from './element';

export const createServerSecurityUI = ({
  useServerUserPermissionsRequirements,
  useServerUserPermissionsIsAdminRequirements,
}: any) => {
  return {
    ServerButtonPermissions: props => (
      <ServerButtonPermissions
        {...props}
        useServerUserPermissionsRequirements={
          useServerUserPermissionsRequirements
        }
        useServerUserPermissionsIsAdminRequirements={
          useServerUserPermissionsIsAdminRequirements
        }
      />
    ),
    ServerElementPermissions: props => (
      <ServerElementPermissions
        {...props}
        useServerUserPermissionsRequirements={
          useServerUserPermissionsRequirements
        }
        useServerUserPermissionsIsAdminRequirements={
          useServerUserPermissionsIsAdminRequirements
        }
      />
    ),
  };
};
