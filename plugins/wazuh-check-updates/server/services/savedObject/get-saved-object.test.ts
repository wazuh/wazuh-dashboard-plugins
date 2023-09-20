import { getInternalSavedObjectsClient } from '../../plugin-services';
import { getSavedObject } from './get-saved-object';

const mockedGetInternalObjectsClient = getInternalSavedObjectsClient as jest.Mock;
jest.mock('../../plugin-services');

describe('getSavedObject function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return saved object', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      find: () => ({ saved_objects: [{ attributes: 'value' }] }),
    }));

    const response = await getSavedObject('type');

    expect(response).toEqual('value');
  });

  test('should return an empty object', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      find: () => ({}),
    }));

    const response = await getSavedObject('type');

    expect(response).toEqual({});
  });

  test('should return an error', async () => {
    mockedGetInternalObjectsClient.mockImplementation(() => ({
      find: jest.fn().mockRejectedValue(new Error('getSavedObject error')),
    }));

    const promise = getSavedObject('type');

    await expect(promise).rejects.toThrow('getSavedObject error');
  });
});
