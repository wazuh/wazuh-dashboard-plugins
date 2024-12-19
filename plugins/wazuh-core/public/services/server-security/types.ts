import React from 'react';
import { BehaviorSubject, Subject } from 'rxjs';

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
  auth$: Subject;
  useDashboardSecurityAccount: () => {
    administrator_requirements: string | null;
  };
  useLoadingLogo: () => { url: string; type: string };
}

export interface ServerSecuritySetupReturn {
  hooks: {
    useServerUserLogged: () => boolean;
    useServerUserPermissions: () => any;
    useServerUserPermissionsRequirements: (
      permissions: ServerSecurityCombinedPermissionWithFunction,
    ) => [ServerSecurityCombinedPermission, any];
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

export interface ServerSecurityUserData {
  logged: boolean;
  policies: any;
  token: string;
}

export interface ServerSecurity {
  serverSecurityUserData$: BehaviorSubject<ServerSecurityUserData>;
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
