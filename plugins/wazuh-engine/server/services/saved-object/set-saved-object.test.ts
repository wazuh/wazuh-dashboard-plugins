import {
  getInternalSavedObjectsClient,
  getWazuhCore,
  getWazuhCheckUpdatesServices,
} from '../../plugin-services';
import { setSavedObject } from './set-saved-object';

const mockedGetInternalObjectsClient =
  getInternalSavedObjectsClient as jest.Mock;
const mockedGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.Mock;
jest.mock('../../plugin-services');

describe('setSavedObject function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return saved object', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      create: () => ({ attributes: { hide_update_notifications: true } }),
    }));
    mockedGetWazuhCheckUpdatesServices.mockImplementation(() => ({
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    }));

    const response = await setSavedObject(
      'wazuh-check-updates-user-preferences',
      { hide_update_notifications: true },
      'admin',
    );

    expect(response).toEqual({ hide_update_notifications: true });
  });

  test('should return an error', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      create: jest.fn().mockRejectedValue(new Error('setSavedObject error')),
    }));
    mockedGetWazuhCheckUpdatesServices.mockImplementation(() => ({
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    }));

    const promise = setSavedObject(
      'wazuh-check-updates-user-preferences',
      { hide_update_notifications: true },
      'admin',
    );

    await expect(promise).rejects.toThrow('setSavedObject error');
  });
});
