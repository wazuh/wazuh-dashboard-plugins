import { OpenSearchDashboardsRequest } from 'src/core/server';
import { getCore, getWazuhCheckUpdatesServices } from '../../plugin-services';
import { contentManagerRoutes } from '../../../common/constants';

export const subscriptionToIndexer = async (
  request: OpenSearchDashboardsRequest,
): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();
  try {
    const subscription =
      await getCore().opensearch.client.asInternalUser.transport.request({
        method: 'GET',
        path: contentManagerRoutes.subscription,
      });

    return subscription;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get subscription info';

    logger.error(message);
    return Promise.reject(error);
  }
};

export const getStatusSubscriptionIndexer = async (
  request: OpenSearchDashboardsRequest,
): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();
  try {
    // const subscriptionStatus =
    //   await getCore().opensearch.client.asInternalUser.transport.request({
    //     method: 'GET',
    //     path: contentManagerRoutes.subscription,
    //   });

    const subscriptionStatus = {
      status: 200,
      data: {
        access_token: 'AYjcyMdY3ZDhiNmJkNTY',
        token_type: 'Bearer',
      },
    };
    return subscriptionStatus;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get subscription info';

    logger.error(message);
    return Promise.reject(error);
  }
};
