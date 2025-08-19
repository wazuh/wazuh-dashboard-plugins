import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';
import { apiInfo } from './types';

export const getApiInfo = async (): Promise<apiInfo> => {
  const apiInfo = await getCore().http.get(routes.apiInfo, {});

  return apiInfo;
};
