import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';
import { ISubscriptionResponse } from './types';

export const getStatusSubscription =
  async (): Promise<ISubscriptionResponse> => {
    try {
      const statusSubscription = await getCore().http.get(routes.subscription);

      return statusSubscription;
    } catch (error) {
      console.error('Error fetching API info:', error);
      throw error;
    }
  };
