/*
 * Wazuh app - React hooks to manage user role requirements
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

// It retuns user Roles
export const useUserRoles = () => {
  const userRoles = useSelector(state => state.appStateReducers.userRoles);
  return userRoles;
}

// It returns user roles validation and user roles
export const useUserRolesRequirements = (requiredRoles) => {
  const userRoles = useUserRoles();
  if(requiredRoles === null){
    return [false, userRoles]
  }
  const requiredRolesArray = typeof requiredRoles === 'function' ? requiredRoles() : requiredRoles;
  return [WzUserPermissions.checkMissingUserRoles(requiredRolesArray, userRoles), userRoles];
}

// It redirects to other URL if user roles are not valid
export const useUserRolesPrivate = (requiredRoles, redirectURL) => {
  const [userRolesValidation, userRoles] = useUserRolesRequirements(requiredRoles);
  if(userRolesValidation){
    window.location.href = redirectURL;
  }
  return [userRolesValidation, userRoles];
}