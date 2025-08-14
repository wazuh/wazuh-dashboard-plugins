import {
  getWazuhCheckUpdatesServices,
  getWazuhCore,
} from '../../plugin-services';

export const getApiInfo = async (
  queryApi = false,
  forceQuery = false,
): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();
  try {
    const { api: wazuhApiClient } = getWazuhCore();
    let path = '';

    const { data } = await wazuhApiClient.client.asInternalUser.request(
      'GET',
      '/cluster/status',
      {},
      { apiHostID: 'imposter' }, //TODO: Replace with actual API host ID
    );

    const { enabled, running } = data;

    const isClusterMode = enabled == 'yes' && running == 'yes';

    if (!isClusterMode) {
      path = '/manager/info';
    }

    if (isClusterMode) {
      const nodes = await wazuhApiClient.client.asInternalUser.request(
        'GET',
        '/cluster/node',
        {},
        { apiHostID: 'imposter' }, //TODO: Replace with actual API host ID
      );

      const [masterNode] = nodes.find((node: any) => node.type === 'master');

      path = `/cluster/${masterNode.name}/info`;
    }

    try {
      const { data } = await wazuhApiClient.client.asInternalUser.request(
        'GET',
        path,
        {},
        { apiHostID: 'imposter' }, //TODO: Replace with actual API host ID
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
