import { getSavedObject } from '../savedObject/get-saved-object';
import { getUserPreferences } from './get-user-preferences';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common';

const mockedGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../savedObject/get-saved-object');

describe('getUserPreferences function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return user preferences', async () => {
    mockedGetSavedObject.mockImplementation(() => ({
      users: [
        { username: 'admin', last_dismissed_update: 'v4.3.1', hide_update_notifications: false },
      ],
    }));

    const response = await getUserPreferences('admin');

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_USER_PREFERENCES);

    expect(response).toEqual({
      username: 'admin',
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    });
  });

  test('should return an error', async () => {
    mockedGetSavedObject.mockRejectedValue(new Error('getSavedObject error'));

    const promise = getUserPreferences('admin');

    expect(getSavedObject).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('getSavedObject error');
  });
});
