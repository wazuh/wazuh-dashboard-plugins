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
import { wzUserRoles } from '../../../react-services/wz-user-roles';

// It retuns user permissions
export const useUserRoles = () => {
  const userPermissions = useSelector(state => state.appStateReducers.userRoles);
  return userPermissions;
}

// It returns user permissions validation and user permissions
export const useUserRolesRequirements = (requiredRoles) => {
  const userRoles = useUserRoles();
  const requiredPermissionsArray = typeof requiredRoles === 'function' ? requiredRoles() : requiredRoles;
  return [wzUserRoles.checkMissingUserRoles(requiredPermissionsArray, userRoles), userRoles];
}

// It redirects to other URL if user permissions are not valid
export const useUserRolesPrivate = (requiredRoles, redirectURL) => {
  const [userPermissionsValidation, userPermissions] = useUserRolesRequirements(requiredRoles);
  if(userPermissionsValidation){
    window.location.href = redirectURL;
  }
  return [userPermissionsValidation, userPermissions];
}