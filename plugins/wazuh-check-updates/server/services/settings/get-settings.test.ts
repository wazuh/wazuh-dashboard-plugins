import { getSavedObject } from '../savedObject/get-saved-object';
import { setSavedObject } from '../savedObject/set-saved-object';
import { getSettings } from './get-settings';
import { DEFAULT_SCHEDULE, SAVED_OBJECT_SETTINGS } from '../../../common/constants';

const mockedGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../savedObject/get-saved-object');

const mockedSetSavedObject = setSavedObject as jest.Mock;
jest.mock('../savedObject/set-saved-object');

describe('getSettings function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return settings', async () => {
    mockedGetSavedObject.mockImplementation(() => ({ schedule: '* * * * *' }));

    const response = await getSettings();

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_SETTINGS);

    expect(response).toEqual({ schedule: '* * * * *' });
  });

  test('should return default settings', async () => {
    mockedGetSavedObject.mockRejectedValue(new Error('getSavedObject error'));
    mockedSetSavedObject.mockImplementation(() => {});

    const response = await getSettings();

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_SETTINGS);

    expect(response).toEqual({ schedule: DEFAULT_SCHEDULE });
  });

  test('should return an error', async () => {
    mockedGetSavedObject.mockRejectedValue(new Error('getSavedObject error'));
    mockedSetSavedObject.mockRejectedValue(new Error('getSavedObject error'));

    const promise = getSettings();

    expect(getSavedObject).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('getSavedObject error');
  });
});
