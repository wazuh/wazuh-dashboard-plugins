import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common/constants';
import { UserPreferences } from '../../../common/types';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { getSavedObject, setSavedObject } from '../saved-object';

export const updateUserPreferences = async (
  username: string,
  preferences: UserPreferences,
): Promise<UserPreferences> => {
  try {
    const userPreferences =
      ((await getSavedObject(
        SAVED_OBJECT_USER_PREFERENCES,
        username,
      )) as UserPreferences) || {};

    const newUserPreferences = { ...userPreferences, ...preferences };

    await setSavedObject(
      SAVED_OBJECT_USER_PREFERENCES,
      newUserPreferences,
      username,
    );

    return newUserPreferences;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to update user preferences';

    const { logger } = getWazuhCheckUpdatesServices();

    logger.error(message);
    return Promise.reject(error);
  }
};
