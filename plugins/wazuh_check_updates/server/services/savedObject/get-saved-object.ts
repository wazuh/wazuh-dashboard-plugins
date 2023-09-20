import { getInternalSavedObjectsClient } from '../../plugin-services';
import { savedObjectType } from '../../../common/types';

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
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:getSavedObject', message);
    return Promise.reject(error);
  }
};
