import { savedObjectType } from '../../../common/types';
import { getInternalSavedObjectsClient } from '../../plugin-services';

export const setSavedObject = async (
  type: string,
  value: savedObjectType
): Promise<savedObjectType> => {
  try {
    const client = getInternalSavedObjectsClient();

    const responseCreate = await client.create(type, value, {
      id: type,
      overwrite: true,
      refresh: true,
    });

    return responseCreate?.attributes;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:setSavedObject', message);
    return Promise.reject(error);
  }
};
