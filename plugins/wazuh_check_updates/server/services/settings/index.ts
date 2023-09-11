import { DEFAULT_CRON_EXPRESSION, SAVED_OBJECT_SETTINGS } from '../../../common';
import { CheckUpdatesSettings } from '../../../common/types';
import { getSavedObject, setSavedObject } from '..';

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

export const getSettings = async (): Promise<CheckUpdatesSettings> => {
  try {
    const settings = (await getSavedObject(SAVED_OBJECT_SETTINGS)) as CheckUpdatesSettings;
    return settings;
  } catch {
    try {
      const settings = {
        cronExpression: DEFAULT_CRON_EXPRESSION,
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
