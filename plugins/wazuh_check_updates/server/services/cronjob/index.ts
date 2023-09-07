import cron from 'node-cron';
import { getUpdates } from '..';

export async function jobSchedulerRun() {
  //   const configuration = await getConfiguration();
  const configuration = {
    settings: {
      schedule: '* * * * *',
      apiBaseUrl: 'api',
      apiKey: 'sdfsdfsdf',
    },
    deployment: { UID: 'uid' },
  };
  console.log;
  const isValidSchedule = cron.validate(configuration?.settings?.schedule);
  const isValidApiUrl = !!configuration?.settings?.apiBaseUrl?.length;

  if (isValidSchedule && isValidApiUrl)
    cron.schedule(configuration?.settings?.schedule, () => getUpdates());
}
