import _ from 'lodash';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common/constants';
import { UserPreferences, UsersPreferences } from '../../../common/types';
import { log } from '../../lib/logger';
import { getSavedObject } from '../saved-object';

export const getUserPreferences = async (username: string): Promise<UserPreferences> => {
  try {
    const usersPreferences = (await getSavedObject(
      SAVED_OBJECT_USER_PREFERENCES
    )) as UsersPreferences;

    const userPreferences =
      usersPreferences?.users?.find((usersPreference) => usersPreference.username === username) ||
      {};
    const userPreferencesWithoutUsername = _.omit(userPreferences, 'username');

    return userPreferencesWithoutUsername;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get user preferences';
    log('wazuh-check-updates:getUserPreferences', message);
    return Promise.reject(error);
  }
};
