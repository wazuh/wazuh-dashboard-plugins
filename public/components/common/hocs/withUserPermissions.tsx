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
import { useUserPermissions, useUserPermissionsValidation, useUserPermissionsPrivate } from '../hooks/useUserPermissions';
import { 
  EuiToolTip
} from '@elastic/eui';

// This HOC passes permissionsValidation to wrapped component
export const withUserPermissions = WrappedComponent => props => {
  const userPermissions = useUserPermissions();
  return <WrappedComponent {...props} userPermissions={userPermissions}/>;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserPermissionsValidation = requiredUserPermissions => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsValidation(typeof requiredUserPermissions === 'function' ? requiredUserPermissions(props) : requiredUserPermissions);
  return <WrappedComponent {...props} userPermissionsRequirements={userPermissionsValidation} userPermissions={userPermissions}/>;
}

// This HOC redirects to redirectURL if user has not permissions
export const withUserPermissionsPrivate = (read_api_config, redirectURL) => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsPrivate(read_api_config, redirectURL);
  return userPermissionsValidation ? <WrappedComponent {...props} userPermissionsValidation={userPermissionsValidation} userPermissions={userPermissions}/> : null;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserPermissionsValidationButton = requiredUserPermissions => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsValidation(typeof requiredUserPermissions === 'function' ? requiredUserPermissions(props) : requiredUserPermissions);
  const wrappedComponent = <WrappedComponent {...props} isDisabled={Boolean(userPermissionsValidation) || props.isDisabled} userPermissionsRequirements={userPermissionsValidation} userPermissions={userPermissions}/>
  return userPermissionsValidation ? 
    <EuiToolTip
      content={`Require ${userPermissionsValidation.map(permission => typeof permission === 'object' ? permission.action : permission).join(', ')} ${userPermissionsValidation.length > 1 ? 'permissions': 'permission'}`}
      {...props.tooltip}
    >
      {wrappedComponent}
    </EuiToolTip> : wrappedComponent
  ;
}
