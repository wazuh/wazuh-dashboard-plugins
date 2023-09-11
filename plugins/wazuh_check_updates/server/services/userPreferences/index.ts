import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common';
import { UserPreferences, UserPreferencesWithId } from '../../../common/types';
import { getSavedObject, setSavedObject } from '..';

export const updateUserPreferences = async (
  userId: string,
  preferences: UserPreferences
): Promise<UserPreferencesWithId> => {
  const userPreferences = await getUserPreferences(userId);

  const newUserPreferences = { ...userPreferences, ...preferences };

  await setSavedObject(SAVED_OBJECT_USER_PREFERENCES, newUserPreferences);

  return newUserPreferences;
};

export const getUserPreferences = async (userId: string): Promise<UserPreferencesWithId> => {
  try {
    const userPreferences = (await getSavedObject(
      SAVED_OBJECT_USER_PREFERENCES
    )) as UserPreferencesWithId;
    return userPreferences;
  } catch {
    const userPreferences = {
      user_id: userId,
      hide_update_notifications: false,
    };
    await setSavedObject(SAVED_OBJECT_USER_PREFERENCES, userPreferences);

    return userPreferences;
  }
};
