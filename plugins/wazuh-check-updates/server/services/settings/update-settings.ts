import { getSettings } from '.';
import { SAVED_OBJECT_SETTINGS } from '../../../common';
import { CheckUpdatesSettings } from '../../../common/types';
import { setSavedObject } from '../savedObject';

export const updateSettings = async (
  settings: Partial<CheckUpdatesSettings>
): Promise<CheckUpdatesSettings> => {
  try {
    const savedSettings = await getSettings();

    const newSettings = {
      ...savedSettings,
      ...settings,
    };

    await setSavedObject(SAVED_OBJECT_SETTINGS, newSettings);

    return newSettings;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:updateSettings', message);
    return Promise.reject(error);
  }
};
