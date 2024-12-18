import React from 'react';

export interface ServerSecurityPermission {
  action: string;
  resource: string;
}

export type ServerSecurityCombinedPermission =
  | ServerSecurityPermission
  | ServerSecurityPermission[];

export type ServerSecurityCombinedPermissionWithFunction =
  | ServerSecurityCombinedPermission
  | ((props: any) => ServerSecurityPermission);

export interface ServerSecuritySetupDeps {
  userSession$: any;
  getUserSession: any;
  useLoadingLogo: () => { url: string; type: string };
}

export interface ServerSecuritySetupReturn {
  hooks: {
    useServerUserLogged: () => boolean;
    useServerUserPermissions: () => any;
    useServerUserPermissionsRequirements: (
      permissions: ServerSecurityCombinedPermissionWithFunction,
    ) => [ServerSecurityCombinedPermission, any];
    useServerUserPermissionsIsAdminRequirements: () => [string, any];
  };
  hocs: {
    withServerUserAuthorizationPrompt: (
      permissions: ServerSecurityCombinedPermissionWithFunction | null,
      otherPermissions: { isAdmininistrator: boolean | null },
    ) => (WrappedComponent: React.Component) => React.ReactElement;
    withServerUserLogged: (
      WrappedComponent: React.Component,
    ) => React.ReactElement;
  };
  ui: {
    ServerButtonPermissions: React.Component;
    ServerElementPermissions: React.Component;
  };
}

export interface ServerSecurity {
  setup: (deps: ServerSecuritySetupDeps) => ServerSecuritySetupReturn;
  start: () => void;
  stop: () => void;
  checkMissingUserPermissions: (
    requiredPermissions: ServerSecurityCombinedPermission[],
    userPermissions: any,
  ) => ServerSecurityCombinedPermission[] | false;
  getMissingUserPermissions: (
    requiredPermissions: ServerSecurityCombinedPermission[],
  ) => ServerSecurityCombinedPermission[] | false;
}

export interface ServerSecurityUserSession {
  logged: boolean;
  policies: any;
}
