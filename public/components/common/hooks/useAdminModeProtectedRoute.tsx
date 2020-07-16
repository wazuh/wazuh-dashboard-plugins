import { useEffect } from 'react';
import { useSelector } from 'react-redux';

/* Redirect to other route if admin mode is disabled. Return admin mode */
export const useAdminModeProtectedRoute = (redirect = '#') => {
  const adminMode = useSelector(state => state.appStateReducers.adminMode);
  useEffect(() => {
    if(!adminMode){
      window.location.href = redirect;
    }
  }, [adminMode])
  return adminMode;
}