import { getInternalSavedObjectsClient } from '../../plugin-services';
import { AvailableUpdates, UserPreferencesWithId } from '../../../common/types';

export const getSavedObject = async (type: string, id?: string) => {
  try {
    const client = getInternalSavedObjectsClient();
    const responseFind = await client.find({
      type: type,
    });

    console.log(responseFind?.saved_objects[0]);

    const result = responseFind.saved_objects?.length
      ? responseFind.saved_objects[0].attributes
      : {};
    return result;
  } catch (error) {
    console.log(error);
  }
};

export const setSavedObject = async (
  type: string,
  value: AvailableUpdates | UserPreferencesWithId
) => {
  try {
    const client = getInternalSavedObjectsClient();

    const responseCreate = await client.create(type, value, {
      id: type,
      overwrite: true,
      refresh: true,
    });

    console.log({ responseCreate });

    await getSavedObject(type);

    return responseCreate?.attributes;
  } catch (error) {
    console.log(error);
  }
};
