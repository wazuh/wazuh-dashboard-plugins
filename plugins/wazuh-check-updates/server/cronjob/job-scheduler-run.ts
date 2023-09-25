import cron from 'node-cron';
import { DEFAULT_SCHEDULE } from '../../common/constants';
import { getSettings } from '../services/settings';
import { getUpdates } from '../services/updates';
import { log } from '../lib/logger';

export const jobSchedulerRun = async () => {
  try {
    const settings = await getSettings();

    cron.schedule(settings?.schedule || DEFAULT_SCHEDULE, () => getUpdates());
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
