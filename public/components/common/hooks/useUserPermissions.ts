/*
 * Wazuh app - React hook for get query of Kibana searchBar
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { useSelector } from 'react-redux';
import { checkMissingUserPermissions } from '../../../react-services/rbac';

// It retuns user permissions
export const useUserPermissions = () => {
  const userPermissions = useSelector(state => state.appStateReducers.userPermissions);
  return userPermissions;
}

// It returns user permissions validation and user permissions
export const useUserPermissionsValidation = (requiredPermissions) => {
  const userPermissions = useUserPermissions();
  const requiredPermissionsArray = typeof requiredPermissions === 'function' ? requiredPermissions() : requiredPermissions;
  return [checkMissingUserPermissions(requiredPermissionsArray, userPermissions), userPermissions];
}

// It redirects to other URL if user permissions are not valid
export const useUserPermissionsPrivate = (requiredPermissions, redirectURL) => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsValidation(requiredPermissions);
  if(userPermissionsValidation){
    window.location.href = redirectURL;
  }
  return [userPermissionsValidation, userPermissions];
}