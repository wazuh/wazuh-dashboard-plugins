import { getInternalSavedObjectsClient } from '../../plugin-services';
import {
  AvailableUpdates,
  CheckUpdatesSettings,
  UserPreferencesWithId,
} from '../../../common/types';

type savedObjectType = AvailableUpdates | UserPreferencesWithId | CheckUpdatesSettings;

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

    await getSavedObject(type);

    return responseCreate?.attributes;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:setSavedObject', message);
    return Promise.reject(error);
  }
};
