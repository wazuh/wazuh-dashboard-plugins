import { updateUserPreferences } from '.';
import { getSavedObject } from '../savedObject/get-saved-object';
import { setSavedObject } from '../savedObject/set-saved-object';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common';

const mockedGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../savedObject/get-saved-object');

const mockedSetSavedObject = setSavedObject as jest.Mock;
jest.mock('../savedObject/set-saved-object');

describe('updateUserPreferences function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return user preferences', async () => {
    mockedGetSavedObject.mockImplementation(() => ({
      users: [
        { username: 'admin', last_dismissed_update: 'v4.3.1', hide_update_notifications: false },
      ],
    }));

    mockedSetSavedObject.mockImplementation(() => {});

    const response = await updateUserPreferences('admin', {
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    });

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_USER_PREFERENCES);

    expect(response).toEqual({
      username: 'admin',
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    });
  });

  test('should return an error', async () => {
    mockedSetSavedObject.mockRejectedValue(new Error('getSavedObject error'));

    const promise = updateUserPreferences('admin', {
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    });

    expect(getSavedObject).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('getSavedObject error');
  });
});