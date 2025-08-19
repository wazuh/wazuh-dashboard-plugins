import { OpenSearchDashboardsRequest } from 'src/core/server';
import {
  getWazuhCheckUpdatesServices,
  getWazuhCore,
} from '../../plugin-services';

export const getApiInfo = async (
  request: OpenSearchDashboardsRequest,
): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();
  try {
    const { utils, api: wazuhApiClient } = getWazuhCore();

    const apiHostID = utils.getAPIHostIDFromCookie(
      request.headers.cookie,
      'wz-api',
    );

    if (!apiHostID) {
      throw new Error('API host ID not found');
    }

    const { data } = await wazuhApiClient.client.asInternalUser.request(
      'GET',
      '/cluster/nodes',
      {},
      {
        apiHostID,
      },
    );

    const {
      data: { affected_items },
    }: { data: { affected_items: any[] } } = data;

    const masterNode = affected_items.find(
      (node: any) => node.type === 'master',
    );

    const path = `/cluster/${masterNode.name}/info`;

    try {
      const { data } = await wazuhApiClient.client.asInternalUser.request(
        'GET',
        path,
        {},
        { apiHostID },
      );
      logger.info('[INFO]: API info retrieved successfully', data);
      return data;
    } catch {
      logger.debug('[ERROR]: Cannot get the API info');
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get API info';

    logger.error(message);
    return Promise.reject(error);
  }
};
