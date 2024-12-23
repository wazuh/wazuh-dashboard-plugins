# Server security

The `serverSecurity` service is created in the core plugin and manage the security related to the Wazuh server.

- Permissions

## Features

### Service

- Expose methods to check the missing permission for the current user or a generic method

### Others

The service creates in the `setup` lifecycle method the following resources:

- hooks
  - useServerUserPermissions: the permissions of the logged user
  ```tsx
  const userPermissions = useServerUserPermissions();
  ```
  - useServerUserPermissionsRequirements: the missing permissions of the required permissions for the logged user
  ```tsx
  const [missingPermissions, userPermissions] =
    useServerUserPermissionsRequirements(requiredPermissions);
  ```
  - useServerUserPermissionsIsAdminRequirements: the missing requirements for "administrator users"
  ```tsx
  const [administratorRequirements, userSession] =
    useServerUserPermissionsIsAdminRequirements();
  ```
  - useServerUserLogged: user is logged status
  ```tsx
  const useIsLogged = useServerUserLogged();
  ```
- HOCs
  - withServerUserAuthorizationPromptChanged:
  ```tsx
  withServerUserAuthorizationPromptChanged(permissions, {
    isAdmininistrator: true,
  })(WrappedComponent);
  ```
  - withServerUserLogged: when the user is not logged, display a loading
  ```tsx
  withServerUserLogged(WrappedComponent);
  ```
  - withServerUserAuthorizationPrompt:
  ```tsx
  withServerUserAuthorizationPrompt(permissions, { isAdmininistrator: true })(
    WrappedComponent,
  );
  ```
- UI components
  - ServerButtonPermissions
  - ServerElementPermissions
