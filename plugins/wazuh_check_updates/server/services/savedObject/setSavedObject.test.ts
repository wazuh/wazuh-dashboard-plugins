import { getInternalSavedObjectsClient } from '../../plugin-services';
import { setSavedObject } from './setSavedObject';

const mockedGetInternalObjectsClient = getInternalSavedObjectsClient as jest.Mock;
jest.mock('../../plugin-services');

describe('setSavedObject function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return saved object', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      create: () => ({ attributes: { schedule: '* * * * *' } }),
    }));

    const response = await setSavedObject('settings', { schedule: '* * * * *' });

    expect(response).toEqual({ schedule: '* * * * *' });
  });

  test('should return an error', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      create: jest.fn().mockRejectedValue(new Error('setSavedObject error')),
    }));

    const promise = setSavedObject('settings', { schedule: '* * * * *' });

    await expect(promise).rejects.toThrow('setSavedObject error');
  });
});
