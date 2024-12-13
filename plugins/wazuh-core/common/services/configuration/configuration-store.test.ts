import { IConfigurationProvider } from './configuration-provider';
import { ConfigurationStore } from './configuration-store';

function createMockLogger() {
  const noop = () => {};

  const logger = {
      info: noop,
      error: noop,
      debug: noop,
      warn: noop,
      trace: noop,
      fatal: noop,
      log: noop,
      get: () => logger,
    };
  return logger;
}

const mockedProvider = jest.mocked<IConfigurationProvider>({
  getAll: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setName: jest.fn(),
  getName: jest.fn(),
})

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe(`[service] ConfigurationStore`, () => {
  // Create instance
  it('should create an instance of ConfigurationStore', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    expect(configurationStore).toBeInstanceOf(ConfigurationStore);
  });

  it('should register a provider', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    configurationStore.registerProvider('test', mockedProvider);
    expect(mockedProvider.setName).toBeCalledWith('test');
  })

  it('should return error if provider is not defined when registering', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    // @ts-ignore
    expect(() => configurationStore.registerProvider('test', null)).toThrowError('Provider is required');
  })


  it('should return a configuration from a provider', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    configurationStore.registerProvider('test', mockedProvider);
    (mockedProvider.getAll as jest.Mock).mockResolvedValue({ test: 'test' });
    expect(configurationStore.getProviderConfiguration('test')).resolves.toEqual({ test: 'test' });
  })

  it('should return error if provider is not defined when getting configuration', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    expect(configurationStore.getProviderConfiguration('test')).rejects.toThrowError('Provider test not found');
  })

  it('should return the provider', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    configurationStore.registerProvider('test', mockedProvider);
    expect(configurationStore.getProvider('test')).toBe(mockedProvider);
  })

  it('should return error if provider is not defined when getting provider', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    expect(() => configurationStore.getProvider('test')).toThrowError('Provider test not found');
  })

  it('should return a configuration value by key', async () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    (mockedProvider.getAll as jest.Mock).mockResolvedValue({ test: 'test' });
    (mockedProvider.get as jest.Mock).mockResolvedValue('test');
    configurationStore.registerProvider('test', mockedProvider);
    expect(await configurationStore.get('test')).toEqual('test');
  })

  it('should return error if the configuration key is not found', async () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    (mockedProvider.getAll as jest.Mock).mockResolvedValue({ test: 'test' });
    configurationStore.registerProvider('test', mockedProvider);
    (mockedProvider.get as jest.Mock).mockRejectedValue(new Error('test error'));
    try { 
      await configurationStore.get('test')
    } catch (error) {
      expect(error).toEqual(new Error('test error'));
    }
  })

  it('should return all the configuration from the registered providers', () => {
    const logger = createMockLogger();
    const configurationStore = new ConfigurationStore(logger);
    configurationStore.registerProvider('test', mockedProvider);
    (mockedProvider.getAll as jest.Mock).mockResolvedValue({ test: 'test' });
    expect(configurationStore.getAll()).resolves.toEqual({ test: 'test' });
  })

});
