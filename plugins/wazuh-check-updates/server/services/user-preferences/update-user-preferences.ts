import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common/constants';
import { UserPreferences } from '../../../common/types';
import { log } from '../../lib/logger';
import { getSavedObject, setSavedObject } from '../saved-object';

export const updateUserPreferences = async (
  username: string,
  preferences: UserPreferences
): Promise<UserPreferences> => {
  try {
    const userPreferences =
      ((await getSavedObject(SAVED_OBJECT_USER_PREFERENCES, username)) as UserPreferences) || {};

    const newUserPreferences = { ...userPreferences, ...preferences };

    await setSavedObject(SAVED_OBJECT_USER_PREFERENCES, newUserPreferences, username);

    return newUserPreferences;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to update user preferences';
    log('wazuh-check-updates:getUserPreferences', message);
    return Promise.reject(error);
  }
};
