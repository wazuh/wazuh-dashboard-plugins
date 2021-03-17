/*
 * Wazuh app - React Higher Order Components (HOC)
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export { withWindowSize } from './withWindowSize';

export { withKibanaContext, withKibanaContextExtendsProps } from './withKibanaContext';

export { withUserPermissions, withUserPermissionsRequirements, withUserPermissionsPrivate  } from './withUserPermissions';

export { withUserRoles, withUserRolesRequirements, withUserRolesPrivate  } from './withUserRoles';

export { withUserAuthorizationPrompt} from './withUserAuthorization';

export { withGlobalBreadcrumb  } from './withGlobalBreadcrumb';

export { withReduxProvider  } from './withReduxProvider';

export { withGuard } from './withGuard';

export { withButtonOpenOnClick } from './withButtonOpenOnClick';

export { withAgentSupportModule } from './withAgentSupportModule';

export { withUserLogged } from './withUserLogged';