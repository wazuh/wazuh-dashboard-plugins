import { useSelector } from 'react-redux';

// It retuns user requirements if is is not admin
export const useUserPermissionsIsAdminRequirements = () => {
  const account = useSelector(state => state.appStateReducers.userAccount);
  return [account.administrator_requirements, account];
};
