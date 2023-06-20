/*
 * Wazuh app - React HOCs to manage user role requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from "react";
import { useUserRoles, useUserRolesRequirements, useUserRolesPrivate } from '../hooks/useUserRoles';

// This HOC passes rolesValidation to wrapped component
export const withUserRoles = WrappedComponent => props => {
  const userRoles = useUserRoles();
  return <WrappedComponent {...props} userRoles={userRoles}/>;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserRolesRequirements = requiredUserRoles => WrappedComponent => props => {
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(typeof requiredUserRoles === 'function' ? requiredUserRoles(props) : requiredUserRoles);
  return <WrappedComponent {...props} userRolesRequirements={userRolesRequirements} userRoles={userRoles}/>;
}

// This HOC redirects to redirectURL if user has not permissions
export const withUserRolesPrivate = (requiredUserRoles, redirectURL) => WrappedComponent => props => {
  const [userRolesRequirements, userRoles] = useUserRolesPrivate(requiredUserRoles, redirectURL);
  return userRolesRequirements ? <WrappedComponent {...props} userRolesRequirements={userRolesRequirements} userRoles={userRoles}/> : null;
}

