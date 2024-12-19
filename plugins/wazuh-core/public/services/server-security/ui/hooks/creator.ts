import useObservable from 'react-use/lib/useObservable';

export const createServerSecurityHooks = (services: {
  serverSecurityUserData$: any;
  checkMissingUserPermissions;
}) => {
  const useServerUserPermissions = () => {
    const { policies } = useObservable(
      services.serverSecurityUserData$,
      services.serverSecurityUserData$.getValue(),
    );

    return policies;
  };

  const useServerUserPermissionsRequirements = requiredPermissions => {
    const userPermissions = useServerUserPermissions();

    if (requiredPermissions === null) {
      return [false, userPermissions];
    }

    if (!userPermissions) {
      return [requiredPermissions, {}];
    }

    const requiredPermissionsArray =
      typeof requiredPermissions === 'function'
        ? requiredPermissions()
        : requiredPermissions;

    return [
      services.checkMissingUserPermissions(
        requiredPermissionsArray,
        userPermissions,
      ),
      userPermissions,
    ];
  };

  const useServerUserLogged = () => {
    const { logged } = useObservable(
      services.serverSecurityUserData$,
      services.serverSecurityUserData$.getValue(),
    );

    return logged;
  };

  return {
    useServerUserLogged,
    useServerUserPermissions,
    useServerUserPermissionsRequirements,
  };
};
