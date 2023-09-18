import { getSavedObject } from '../savedObject/getSavedObject';
import { setSavedObject } from '../savedObject/setSavedObject';
import { getSettings } from './getSettings';
import { DEFAULT_SCHEDULE, SAVED_OBJECT_SETTINGS } from '../../../common';

const mockedGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../savedObject/getSavedObject');

const mockedSetSavedObject = setSavedObject as jest.Mock;
jest.mock('../savedObject/setSavedObject');

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
