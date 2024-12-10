import useObservable from 'react-use/lib/useObservable';
import { ServerSecurityUserSession } from '../../types';

export const createServerSecurityHooks = (services: {
  userSession$: any;
  getUserSession: () => ServerSecurityUserSession;
  checkMissingUserPermissions;
}) => {
  const useServerUserPermissions = () => {
    const { policies } = useObservable(
      services.userSession$,
      services.getUserSession(),
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

  const useServerUserPermissionsIsAdminRequirements = () => {
    const { account } = useObservable(
      services.userSession$,
      services.getUserSession(),
    );

    return [account?.administrator_requirements, account];
  };

  const useServerUserLogged = () => {
    const { logged } = useObservable(
      services.userSession$,
      services.getUserSession(),
    );

    return logged;
  };

  return {
    useServerUserLogged,
    useServerUserPermissions,
    useServerUserPermissionsRequirements,
    useServerUserPermissionsIsAdminRequirements,
  };
};
