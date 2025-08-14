import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';
import { apiInfo } from './types';

export const getApiInfo = async (
  queryApi = false,
  forceQuery = false,
): Promise<apiInfo> => {
  const apiInfo = await getCore().http.get(routes.apiInfo, {
    query: {
      query_api: queryApi,
      force_query: forceQuery,
    },
  });

  return apiInfo;
};
