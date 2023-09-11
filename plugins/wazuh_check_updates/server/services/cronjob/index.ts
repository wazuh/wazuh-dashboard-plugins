import cron from 'node-cron';
import { getUpdates } from '..';
import { getSettings } from '..';
import { DEFAULT_CRON_EXPRESSION } from '../../../common';

export const jobSchedulerRun = async () => {
  try {
    const settings = await getSettings();

    console.log({ settings });

    cron.schedule(settings.cronExpression || DEFAULT_CRON_EXPRESSION, () => getUpdates());
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.log('wazuh-check-updates:jobSchedulerRun', message);
    return Promise.reject(error);
  }
};
