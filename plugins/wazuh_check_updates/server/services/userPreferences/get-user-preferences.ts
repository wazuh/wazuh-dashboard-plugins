import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common';
import { UserPreferences, UsersPreferences } from '../../../common/types';
import { getSavedObject } from '../savedObject';

export const getUserPreferences = async (username: string): Promise<UserPreferences> => {
  try {
    const usersPreferences = (await getSavedObject(
      SAVED_OBJECT_USER_PREFERENCES
    )) as UsersPreferences;

    const userPreferences = usersPreferences?.users?.find((up) => up.username === username) || {};

    return userPreferences;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:getUserPreferences', message);
    return Promise.reject(error);
  }
};