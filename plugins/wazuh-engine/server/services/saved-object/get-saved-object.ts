import {
  getInternalSavedObjectsClient,
  getWazuhCheckUpdatesServices,
} from '../../plugin-services';
import { savedObjectType } from '../../../common/types';

export const getSavedObject = async (
  type: string,
  id?: string,
): Promise<savedObjectType> => {
  try {
    const client = getInternalSavedObjectsClient();

    const responseGet = await client.get(type, id || type);

    const result = (responseGet?.attributes || {}) as savedObjectType;
    return result;
  } catch (error: any) {
    if (error?.output?.statusCode === 404) {
      return {};
    }
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get saved object';

    const { logger } = getWazuhCheckUpdatesServices();

    logger.error(message);
    return Promise.reject(error);
  }
};
