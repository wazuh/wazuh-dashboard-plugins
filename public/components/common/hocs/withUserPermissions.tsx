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
export const withUserPermissionsValidation = validateUserPermissions => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsValidation(validateUserPermissions, props);
  return <WrappedComponent {...props} userPermissionsRequirements={userPermissionsValidation} userPermissions={userPermissions}/>;
}

// This HOC redirects to redirectURL if user has not permissions
export const withUserPermissionsPrivate = (validateUserPermissions, redirectURL) => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsPrivate(validateUserPermissions, redirectURL, props);
  return userPermissionsValidation ? <WrappedComponent {...props} userPermissionsValidation={userPermissionsValidation} userPermissions={userPermissions}/> : null;
}

// This HOC hides the wrapped component if user has not permissions
export const withUserPermissionsValidationButton = validateUserPermissions => WrappedComponent => props => {
  const [userPermissionsValidation, userPermissions] = useUserPermissionsValidation(validateUserPermissions, props);
  const wrappedComponent = <WrappedComponent {...props} isDisabled={Boolean(userPermissionsValidation) || props.isDisabled} userPermissionsRequirements={userPermissionsValidation} userPermissions={userPermissions}/>
  return userPermissionsValidation ? 
    <EuiToolTip
      content={userPermissionsValidation}
      {...props.tooltipPosition ? {position: props.tooltipPosition} : {}}
    >
      {wrappedComponent}
    </EuiToolTip> : wrappedComponent
  ;
}
