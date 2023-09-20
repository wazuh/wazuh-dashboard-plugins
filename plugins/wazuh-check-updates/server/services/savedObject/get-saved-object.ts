import { getInternalSavedObjectsClient } from '../../plugin-services';
import { savedObjectType } from '../../../common/types';
import { log } from '../../lib/logger';

export const getSavedObject = async (type: string): Promise<savedObjectType> => {
  try {
    const client = getInternalSavedObjectsClient();
    const responseFind = await client.find({
      type: type,
    });

    const result = (responseFind.saved_objects?.length
      ? responseFind.saved_objects[0].attributes
      : {}) as savedObjectType;
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get saved object';
    log('wazuh-check-updates:getSavedObject', message);
    return Promise.reject(error);
  }
};
