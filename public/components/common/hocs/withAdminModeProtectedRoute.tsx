import React from 'react';
import { useAdminModeProtectedRoute } from '../hooks/useAdminModeProtectedRoute';

/* Redirect to other route if admin mode is disabled */
export const withAdminModeProtectedRoute = redirectRoute => WrappedComponent => props => {
  const adminMode = useAdminModeProtectedRoute(redirectRoute);
  return adminMode ? <WrappedComponent {...props} adminMode={adminMode}/> : null;
}

/* Use */
// withAdminModeProtectedRoute('#manager/?tab=welcome')(CustomComponent)