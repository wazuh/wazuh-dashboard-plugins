import cron from 'node-cron';
import { DEFAULT_SCHEDULE } from '../../common/constants';
import { getSettings } from '../services/settings';
import { getUpdates } from '../services/updates';
import { getWazuhCore } from '../plugin-services';

export const jobSchedulerRun = async () => {
  try {
    const settings = await getSettings();

    cron.schedule(settings?.schedule || DEFAULT_SCHEDULE, () => getUpdates(true));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to schedule a cron job to get updates';

    const {
      services: { log },
    } = getWazuhCore();

    log('wazuh-check-updates:jobSchedulerRun', message);
    return Promise.reject(error);
  }
};
