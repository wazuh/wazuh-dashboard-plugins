import _ from 'lodash';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common/constants';
import { UserPreferences } from '../../../common/types';
import { getSavedObject } from '../saved-object';
import { getWazuhCore } from '../../plugin-services';

export const getUserPreferences = async (username: string): Promise<UserPreferences> => {
  try {
    const userPreferences = (await getSavedObject(
      SAVED_OBJECT_USER_PREFERENCES,
      username
    )) as UserPreferences;

    const userPreferencesWithoutUsername = _.omit(userPreferences, 'username');

    return userPreferencesWithoutUsername;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get user preferences';

    const {
      services: { log },
    } = getWazuhCore();

    log('wazuh-check-updates:getUserPreferences', message);
    return Promise.reject(error);
  }
};
