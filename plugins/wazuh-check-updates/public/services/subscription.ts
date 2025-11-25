import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';
import { apiInfo } from './types';

export const getStatusSubscription = async (): Promise<apiInfo> => {
  try {
    const statusSubscription = await getCore().http.get(routes.subscription);
    console.log('API Info fetched:', statusSubscription);

    return statusSubscription;
  } catch (error) {
    console.error('Error fetching API info:', error);
    throw error;
  }
};
