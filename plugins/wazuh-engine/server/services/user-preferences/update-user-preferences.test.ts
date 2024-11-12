import { updateUserPreferences } from '.';
import { getSavedObject } from '../saved-object/get-saved-object';
import { setSavedObject } from '../saved-object/set-saved-object';
import { SAVED_OBJECT_USER_PREFERENCES } from '../../../common/constants';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

jest.mock('../saved-object/set-saved-object', () => ({
  setSavedObject: jest.fn(),
}));

jest.mock('../saved-object/get-saved-object', () => ({
  getSavedObject: jest.fn(),
}));

jest.mock('../../plugin-services', () => ({
  getInternalSavedObjectsClient: jest.fn(),
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const mockedGetSavedObject = getSavedObject as jest.Mock;
const mockedSetSavedObject = setSavedObject as jest.Mock;

const mockedGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.Mock;

describe('updateUserPreferences function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return user preferences', async () => {
    mockedGetSavedObject.mockImplementation(() => ({
      last_dismissed_updates: [
        {
          api_id: 'api id',
          last_patch: '4.3.1',
        },
      ],
      hide_update_notifications: false,
    }));

    mockedSetSavedObject.mockImplementation(() => {});
    mockedGetWazuhCheckUpdatesServices.mockImplementation(() => ({
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    }));

    const response = await updateUserPreferences('admin', {
      last_dismissed_updates: [
        {
          api_id: 'api id',
          last_patch: '4.3.1',
        },
      ],
      hide_update_notifications: false,
    });

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(
      SAVED_OBJECT_USER_PREFERENCES,
      'admin',
    );

    expect(response).toEqual({
      last_dismissed_updates: [
        {
          api_id: 'api id',
          last_patch: '4.3.1',
        },
      ],
      hide_update_notifications: false,
    });
  });

  test('should return an error', async () => {
    mockedSetSavedObject.mockRejectedValue(new Error('getSavedObject error'));

    const promise = updateUserPreferences('admin', {
      last_dismissed_updates: [
        {
          api_id: 'api id',
          last_patch: '4.3.1',
        },
      ],
      hide_update_notifications: false,
    });

    expect(getSavedObject).toHaveBeenCalledTimes(1);

    await expect(promise).rejects.toThrow('getSavedObject error');
  });
});
