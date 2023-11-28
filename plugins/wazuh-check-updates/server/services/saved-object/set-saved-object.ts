import { savedObjectType } from '../../../common/types';
import {
  getInternalSavedObjectsClient,
  getWazuhCheckUpdatesServices,
} from '../../plugin-services';

export const setSavedObject = async (
  type: string,
  value: savedObjectType,
  id?: string,
): Promise<savedObjectType> => {
  try {
    const client = getInternalSavedObjectsClient();

    const responseCreate = await client.create(type, value, {
      id: id || type,
      overwrite: true,
      refresh: true,
    });

    return responseCreate?.attributes;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to update saved object';

    const { logger } = getWazuhCheckUpdatesServices();

    logger.error(message);
    return Promise.reject(error);
  }
};
