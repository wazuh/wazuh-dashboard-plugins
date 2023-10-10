import { getSettings } from '.';
import { SAVED_OBJECT_SETTINGS } from '../../../common/constants';
import { CheckUpdatesSettings } from '../../../common/types';
import { getWazuhCore } from '../../plugin-services';
import { setSavedObject } from '../saved-object';

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
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to update settings';

    const {
      services: { log },
    } = getWazuhCore();

    log('wazuh-check-updates:updateSettings', message);
    return Promise.reject(error);
  }
};
