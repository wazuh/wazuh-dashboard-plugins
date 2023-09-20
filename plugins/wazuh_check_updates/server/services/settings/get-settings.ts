import { DEFAULT_SCHEDULE, SAVED_OBJECT_SETTINGS } from '../../../common';
import { CheckUpdatesSettings } from '../../../common/types';
import { getSavedObject, setSavedObject } from '../savedObject';

export const getSettings = async (): Promise<CheckUpdatesSettings> => {
  try {
    const settings = (await getSavedObject(SAVED_OBJECT_SETTINGS)) as CheckUpdatesSettings;
    return settings;
  } catch {
    try {
      const settings = {
        schedule: DEFAULT_SCHEDULE,
      };
      await setSavedObject(SAVED_OBJECT_SETTINGS, settings);

      return settings;
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      console.log('wazuh-check-updates:getSettings', message);
      return Promise.reject(error);
    }
  }
};
