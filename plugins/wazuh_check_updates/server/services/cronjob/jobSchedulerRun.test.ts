import cron from 'node-cron';
import { getSettings } from '../settings';
import { getUpdates } from '../updates';
import { jobSchedulerRun } from './jobSchedulerRun';

const mockedCron = cron.schedule as jest.Mock;
jest.mock('node-cron');

const mockedGetSettings = getSettings as jest.Mock;
jest.mock('../settings');

const mockedGetUpdates = getUpdates as jest.Mock;
jest.mock('../updates');

describe('jobSchedulerRun function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('schedule job to check updates', async () => {
    mockedCron.mockImplementation(() => {});
    mockedGetSettings.mockImplementation(() => ({ schedule: '* * * * *' }));
    mockedGetUpdates.mockImplementation(() => ({}));

    const response = await jobSchedulerRun();

    expect(getSettings).toHaveBeenCalledTimes(1);
    expect(getSettings).toHaveBeenCalledWith();

    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));

    expect(response).toBeUndefined();
  });

  test('should return an error', async () => {
    mockedGetSettings.mockRejectedValue(new Error('getSettings error'));

    const promise = jobSchedulerRun();

    expect(getSettings).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('getSettings error');
  });
});
