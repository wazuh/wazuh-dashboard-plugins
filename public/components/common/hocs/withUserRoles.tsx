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

import React from "react";
import { useUserRoles, useUserRolesRequirements, useUserRolesPrivate } from '../hooks/useUserRoles';
import { 
  EuiToolTip
} from '@elastic/eui';

// This HOC passes permissionsValidation to wrapped component
export const withUserRoles = WrappedComponent => props => {
  const userRoles = useUserRoles();
  return <WrappedComponent {...props} userRoles={userRoles}/>;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserPermissionsValidation = requiredUserRoles => WrappedComponent => props => {
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(typeof requiredUserRoles === 'function' ? requiredUserRoles(props) : requiredUserRoles);
  return <WrappedComponent {...props} userRolesRequirements={userRolesRequirements} userRoles={userRoles}/>;
}

// This HOC redirects to redirectURL if user has not permissions
export const withUserPermissionsPrivate = (read_api_config, redirectURL) => WrappedComponent => props => {
  const [userRolesRequirements, userRoles] = useUserRolesPrivate(read_api_config, redirectURL);
  return userRolesRequirements ? <WrappedComponent {...props} userRolesRequirements={userRolesRequirements} userRoles={userRoles}/> : null;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserPermissionsValidationButton = requiredUserRoles => WrappedComponent => props => {
  const [userRolesRequirements, userRoles] = useUserRolesRequirements(typeof requiredUserRoles === 'function' ? requiredUserRoles(props) : requiredUserRoles);
  const wrappedComponent = <WrappedComponent {...props} isDisabled={Boolean(userRolesRequirements) || props.isDisabled} userPermissionsRequirements={userRolesRequirements} userRoles={userRoles}/>
  return userRolesRequirements ? 
    <EuiToolTip
      content={`Require ${userRolesRequirements.map(permission => typeof permission === 'object' ? permission.action : permission).join(', ')} ${userRolesRequirements.length > 1 ? 'roles': 'role'}`}
      {...props.tooltip}
    >
      {wrappedComponent}
    </EuiToolTip> : wrappedComponent
  ;
}
