/*
 * Wazuh app - React hooks to manage user permission requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { useSelector } from 'react-redux';
import { WzUserPermissions } from '../../../react-services/wz-user-permissions';

// It retuns user permissions
export const useUserPermissions = () => {
  return useSelector((state) => state.appStateReducers.userPermissions);
};

// It returns user permissions validation and user permissions
export const useUserPermissionsRequirements = (requiredPermissions) => {
  const userPermissions = useUserPermissions();
  if (requiredPermissions === null) {
    return [false, userPermissions];
  }

  if (!userPermissions) {
    return [requiredPermissions, []];
  }

  const requiredPermissionsArray =
    typeof requiredPermissions === 'function' ? requiredPermissions() : requiredPermissions;
  return [
    WzUserPermissions.checkMissingUserPermissions(requiredPermissionsArray, userPermissions),
    userPermissions,
  ];
};

// It redirects to other URL if user permissions are not valid
export const useUserPermissionsPrivate = (requiredPermissions, redirectURL) => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsRequirements(
    requiredPermissions
  );
  if (userPermissionsValidation) {
    window.location.href = redirectURL;
  }
  return [userPermissionsValidation, userPermissions];
};
