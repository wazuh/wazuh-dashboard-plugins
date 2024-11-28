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
    (permissions = null, othersPermissions = { isAdmininistrator: null }) =>
    (WrappedComponent: React.ElementType) =>
    props => {
      const [userPermissionRequirements, userPermissions] =
        useServerUserPermissionsRequirements(
          typeof permissions === 'function' ? permissions(props) : permissions,
        );
      const [_userPermissionIsAdminRequirements] =
        useServerUserPermissionsIsAdminRequirements();

      const userPermissionIsAdminRequirements =
        othersPermissions?.isAdmininistrator
          ? _userPermissionIsAdminRequirements
          : null;

      return userPermissionRequirements || userPermissionIsAdminRequirements ? (
        <PromptNoPermissions
          permissions={userPermissionRequirements}
          administrator={userPermissionIsAdminRequirements}
        />
      ) : (
        <WrappedComponent {...props} />
      );
    };

  const withServerUserLogged =
    (WrappedComponent: React.ElementType) => props => {
      const withServerUserLogged = useServerUserLogged();

      return withServerUserLogged ? (
        <WrappedComponent {...props} />
      ) : (
        <LoadingServerUserLogging useLoadingLogo={useLoadingLogo} />
      );
    };

  const withServerUserAuthorizationPrompt =
    (permissions = null, othersPermissions = { isAdmininistrator: null }) =>
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
