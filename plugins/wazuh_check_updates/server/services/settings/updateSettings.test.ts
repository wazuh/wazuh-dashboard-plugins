import { updateSettings } from '.';
import { getSavedObject } from '../savedObject/getSavedObject';
import { setSavedObject } from '../savedObject/setSavedObject';
import { SAVED_OBJECT_SETTINGS } from '../../../common';

const mockedGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../savedObject/getSavedObject');

const mockedSetSavedObject = setSavedObject as jest.Mock;
jest.mock('../savedObject/setSavedObject');

describe('updateSettings function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return user preferences', async () => {
    mockedGetSavedObject.mockImplementation(() => ({ schedule: '* * * * *' }));

    mockedSetSavedObject.mockImplementation(() => {});

    const response = await updateSettings({ schedule: '* * * * *' });

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_SETTINGS);

    expect(response).toEqual({ schedule: '* * * * *' });
  });

  test('should return an error', async () => {
    mockedSetSavedObject.mockRejectedValue(new Error('getSavedObject error'));

    const promise = updateSettings({ schedule: '* * * * *' });

    expect(getSavedObject).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('getSavedObject error');
  });
});
