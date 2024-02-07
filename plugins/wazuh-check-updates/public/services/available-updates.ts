import { AvailableUpdates } from '../../common/types';
import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';

export const getAvailableUpdates = async (
  queryApi = false,
  forceQuery = false,
): Promise<AvailableUpdates> => {
  const checkUpdates = sessionStorage.getItem('checkUpdates');
  const alreadyCheckUpdates = checkUpdates === 'executed';

  const availableUpdates = await getCore().http.get(routes.checkUpdates, {
    query: {
      query_api: queryApi || !alreadyCheckUpdates,
      force_query: forceQuery,
    },
  });

  if (!alreadyCheckUpdates) {
    sessionStorage.setItem('checkUpdates', 'executed');
  }

  return availableUpdates;
};
