
import { AppRootState } from '../../../redux/types';
import { useSelector } from 'react-redux';

export const useAppConfig = () => {
  const appConfig = useSelector((state: AppRootState) => state.appConfigState);
  return appConfig;
}
