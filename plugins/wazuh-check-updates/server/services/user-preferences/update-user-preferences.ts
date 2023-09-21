import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common/constants';
import { UserPreferences, UsersPreferences } from '../../../common/types';
import { log } from '../../lib/logger';
import { getSavedObject, setSavedObject } from '../saved-object';

export const updateUserPreferences = async (
  username: string,
  preferences: UserPreferences
): Promise<UserPreferences> => {
  try {
    const usersPreferences =
      ((await getSavedObject(SAVED_OBJECT_USER_PREFERENCES)) as UsersPreferences)?.users || [];

    const userPreferences =
      usersPreferences?.find((userPreference) => userPreference.username === username) || {};

    const newUserPreferences = { ...userPreferences, ...preferences, username: username };

    const newUsersPreferences = [
      ...usersPreferences?.filter((up) => up.username !== username),
      newUserPreferences,
    ];

    await setSavedObject(SAVED_OBJECT_USER_PREFERENCES, { users: newUsersPreferences });

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
