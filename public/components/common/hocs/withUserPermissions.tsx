/*
 * Wazuh app - React HOCs to manage user permission requirements
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
import { useUserPermissions, useUserPermissionsRequirements, useUserPermissionsPrivate } from '../hooks/useUserPermissions';

// This HOC passes permissionsValidation to wrapped component
export const withUserPermissions = WrappedComponent => props => {
  const userPermissions = useUserPermissions();
  return <WrappedComponent {...props} userPermissions={userPermissions}/>;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserPermissionsRequirements = requiredUserPermissions => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsRequirements(typeof requiredUserPermissions === 'function' ? requiredUserPermissions(props) : requiredUserPermissions);
  return <WrappedComponent {...props} userPermissionsRequirements={userPermissionsValidation} userPermissions={userPermissions}/>;
}

// This HOC redirects to redirectURL if user has not permissions
export const withUserPermissionsPrivate = (requiredUserPermissions, redirectURL) => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsPrivate(requiredUserPermissions, redirectURL);
  return userPermissionsValidation ? <WrappedComponent {...props} userPermissionsValidation={userPermissionsValidation} userPermissions={userPermissions}/> : null;
}
