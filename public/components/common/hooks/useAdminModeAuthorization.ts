import { useSelector } from 'react-redux';

/* Return admin mode from Redux Store */
export const useAdminModeAuthorization = () => {
  const adminMode = useSelector(state => state.appStateReducers.adminMode);
  return adminMode;
}