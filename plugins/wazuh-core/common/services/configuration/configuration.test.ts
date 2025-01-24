import { createMockLogger } from '../../../test/mocks/logger-mocked';
import { Configuration } from './configuration';
import { IConfigurationStore } from './types';

const mockConfigurationStore: IConfigurationStore = {
  setup: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  set: jest.fn(),
  getProviderConfiguration: jest.fn(),
  registerProvider: jest.fn(),
  getProvider: jest.fn(),
};

describe('Configuration service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an instance of Configuration', () => {
    const logger = createMockLogger();
    const configuration = new Configuration(logger, mockConfigurationStore);

    expect(configuration).toBeInstanceOf(Configuration);
  });

  it('should set store', () => {
    const logger = createMockLogger();
    const configuration = new Configuration(logger, mockConfigurationStore);

    configuration.setStore(mockConfigurationStore);
    expect(configuration.store).toBe(mockConfigurationStore);
  });

  it('should return error if store is not provided', () => {
    const logger = createMockLogger();

    try {
      // @ts-expect-error Testing error case
      new Configuration(logger, null);
    } catch (error) {
      expect(error).toEqual(new Error('Configuration store is required'));
    }
  });

  it('should return a configuration setting value', () => {
    const logger = createMockLogger();
    const configuration = new Configuration(logger, mockConfigurationStore);

    configuration.get('key');
    expect(mockConfigurationStore.get).toBeCalledWith('key');
    expect(mockConfigurationStore.get).toBeCalledTimes(1);
  });

  it('should return error if the configuration setting key not exists', async () => {
    const logger = createMockLogger();
    const configuration = new Configuration(logger, mockConfigurationStore);

    mockConfigurationStore.get.mockRejectedValue(
      new Error('Configuration setting not found'),
    );

    try {
      await configuration.get('key');
    } catch (error) {
      expect(mockConfigurationStore.get).toBeCalledWith('key');
      expect(error).toEqual(new Error('Configuration setting not found'));
    }
  });

  it('should return all configuration settings', () => {
    const logger = createMockLogger();
    const configuration = new Configuration(logger, mockConfigurationStore);

    configuration.getAll();
    expect(mockConfigurationStore.getAll).toBeCalledTimes(1);
  });

  it('should return error if the configuration settings not exists', async () => {
    const logger = createMockLogger();
    const configuration = new Configuration(logger, mockConfigurationStore);

    mockConfigurationStore.getAll.mockRejectedValue(
      new Error('Configuration settings not found'),
    );

    try {
      await configuration.getAll();
    } catch (error) {
      expect(mockConfigurationStore.getAll).toBeCalledTimes(1);
      expect(error).toEqual(new Error('Configuration settings not found'));
    }
  });
});
