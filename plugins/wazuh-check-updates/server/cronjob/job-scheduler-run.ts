import cron from 'node-cron';
import { DEFAULT_SCHEDULE } from '../../common/constants';
import { getSettings } from '../services/settings';
import { getUpdates } from '../services/updates';
import { log } from '../lib/logger';

export const jobSchedulerRun = async () => {
  try {
    //The first time should get the updates from the Wazuh API
    await getUpdates(true);

    const settings = await getSettings();

    cron.schedule(settings?.schedule || DEFAULT_SCHEDULE, () => getUpdates(true));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to schedule a cron job to get updates';
    log('wazuh-check-updates:jobSchedulerRun', message);
    return Promise.reject(error);
  }
};
