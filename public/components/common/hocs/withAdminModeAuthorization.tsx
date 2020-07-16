import React from 'react';
import { useAdminModeAuthorization } from '../hooks/useAdminModeAuthorization';

/* Render wrapped component if admin mode is enabled */
export const withAdminModeAuthorization = WrappedComponent => props => {
  const adminMode = useAdminModeAuthorization();
  return adminMode ? <WrappedComponent {...props} adminMode={adminMode}/> : null;
}

/* Use */
/*
withAdminModeAuthorization(CustomComponent)
*/