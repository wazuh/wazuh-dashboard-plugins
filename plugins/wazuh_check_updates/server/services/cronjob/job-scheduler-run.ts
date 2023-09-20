import cron from 'node-cron';
import { DEFAULT_SCHEDULE } from '../../../common';
import { getSettings } from '../settings';
import { getUpdates } from '../updates';

export const jobSchedulerRun = async () => {
  try {
    const settings = await getSettings();

    cron.schedule(settings?.schedule || DEFAULT_SCHEDULE, () => getUpdates());
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:jobSchedulerRun', message);
    return Promise.reject(error);
  }
};
