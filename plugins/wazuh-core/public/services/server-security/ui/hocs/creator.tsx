import React from 'react';
import { compose } from 'redux';

export const createServerSecurityHOCS = ({
  useServerUserPermissionsRequirements,
  useServerUserPermissionsIsAdminRequirements,
  useServerUserLogged,
  useLoadingLogo,
  PromptNoPermissions,
  LoadingServerUserLogging,
}) => {
  const withServerUserAuthorizationPromptChanged =
    (
      permissions = null,
      othersPermissions: { isAdmininistrator: boolean | null },
    ) =>
    (WrappedComponent: React.ElementType) =>
      function withServerUserAuthorizationPromptChanged(props) {
        const [userPermissionRequirements] =
          useServerUserPermissionsRequirements(
            typeof permissions === 'function'
              ? permissions(props)
              : permissions,
          );
        const [userPermissionIsAdminRequirementsState] =
          useServerUserPermissionsIsAdminRequirements();
        const userPermissionIsAdminRequirements =
          othersPermissions?.isAdmininistrator
            ? userPermissionIsAdminRequirementsState
            : null;

        return userPermissionRequirements ||
          userPermissionIsAdminRequirements ? (
          <PromptNoPermissions
            permissions={userPermissionRequirements}
            administrator={userPermissionIsAdminRequirements}
          />
        ) : (
          <WrappedComponent {...props} />
        );
      };

  const withServerUserLogged = (WrappedComponent: React.ElementType) =>
    function WithServerUserLogged(props) {
      const withServerUserLogged = useServerUserLogged();

      return withServerUserLogged ? (
        <WrappedComponent {...props} />
      ) : (
        <LoadingServerUserLogging useLoadingLogo={useLoadingLogo} />
      );
    };

  const withServerUserAuthorizationPrompt =
    (
      permissions = null,
      othersPermissions: { isAdmininistrator: boolean | null },
    ) =>
    (WrappedComponent: React.ElementType) =>
      compose(
        withServerUserLogged,
        withServerUserAuthorizationPromptChanged(
          permissions,
          othersPermissions,
        ),
      )(WrappedComponent);

  return {
    withServerUserAuthorizationPrompt,
    withServerUserLogged,
  };
};
