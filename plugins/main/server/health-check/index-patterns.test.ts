import fs from 'fs';
import {
  ensureIndexPatternHasTemplate,
  initializationTaskCreatorIndexPattern,
} from './index-patterns';

const mockContext = () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  services: {
    core: {
      opensearch: {
        client: {
          asInternalUser: {
            cat: {
              templates: () => {
                return {
                  body: [
                    {
                      name: 'wazuh',
                      index_patterns: '[wazuh-events-v5*, wazuh-findings-v5*]',
                      order: '0',
                      version: '1',
                      composed_of: '',
                    },
                    {
                      name: 'metrics-agents',
                      index_patterns: '[wazuh-metrics-agents*]',
                      order: '0',
                      version: null,
                      composed_of: '',
                    },
                    {
                      name: 'metrics-comms',
                      index_patterns: '[wazuh-metrics-comms*]',
                      order: '0',
                      version: null,
                      composed_of: '',
                    },
                    {
                      name: 'metrics-normalization',
                      index_patterns: '[wazuh-metrics-normalization*',
                      order: '0',
                      version: null,
                      composed_of: '',
                    },
                  ],
                };
              },
            },
          },
        },
      },
    },
  },
});

// TODO: the templates are deprecated and the test makes no sense, this could be removed.
describe('getTemplateForIndexPattern', () => {
  it.each`
    indexPatternTitle          | templateFound | templatesNameFound
    ${'custom-alerts-*'}       | ${false}      | ${'Template was not found for [custom-alerts-*]'}
    ${'custom-wazuh-events-*'} | ${false}      | ${'Template was not found for [custom-wazuh-events-*]'}
    ${'wazuh-events-v5-t*'}    | ${true}       | ${['wazuh']}
    ${'wazuh-events-v5-*'}     | ${true}       | ${['wazuh']}
    ${'wazuh-events-v5*'}      | ${true}       | ${['wazuh']}
    ${'wazuh-events-v*'}       | ${true}       | ${['wazuh']}
    ${'wazuh-events-*'}        | ${true}       | ${['wazuh']}
    ${'wazuh-events-'}         | ${true}       | ${['wazuh']}
    ${'wazuh-events'}          | ${true}       | ${['wazuh']}
    ${'wazuh-ev'}              | ${true}       | ${['wazuh']}
    ${'wazuh-e'}               | ${true}       | ${['wazuh']}
  `(
    `indexPatternTitle: $indexPatternTitle`,
    async ({ indexPatternTitle, templateFound, templatesNameFound }) => {
      if (!templateFound) {
        expect(() =>
          ensureIndexPatternHasTemplate(mockContext(), indexPatternTitle),
        ).rejects.toThrow(templatesNameFound);
      } else {
        expect(
          (
            await ensureIndexPatternHasTemplate(
              mockContext(),
              indexPatternTitle,
            )
          ).map(({ name }) => name),
        ).toEqual(templatesNameFound);
      }
    },
  );
});

describe('initializationTaskCreatorIndexPattern - checkDefaultIndexPattern', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    get: jest.fn().mockReturnThis(),
  };

  const createMockContext = (defaultIndex = undefined) => {
    const savedObjectsClient = {
      get: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };
    const uiSettingsClient = {
      get: jest.fn().mockResolvedValue(defaultIndex),
      set: jest.fn().mockResolvedValue(undefined),
    };

    return {
      context: {
        logger: mockLogger,
        scope: ['internal'],
        services: {
          core: {
            savedObjects: {
              createInternalRepository: jest
                .fn()
                .mockReturnValue(savedObjectsClient),
            },
            opensearch: {
              legacy: { client: { callAsInternalUser: jest.fn() } },
            },
            uiSettings: {
              asScopedToClient: jest.fn().mockReturnValue(uiSettingsClient),
            },
          },
        },
      },
      savedObjectsClient,
      uiSettingsClient,
    };
  };

  beforeEach(() => jest.clearAllMocks());

  it('should set defaultIndex when it does not exist', async () => {
    const { context, savedObjectsClient, uiSettingsClient } =
      createMockContext(null);
    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPattern({
      taskName: 'test-task',
      indexPatternID: 'wazuh-events-*',
      options: { checkDefaultIndexPattern: true },
    });

    await task.run({ context, logger: mockLogger });

    expect(uiSettingsClient.get).toHaveBeenCalledWith('defaultIndex');
    expect(uiSettingsClient.set).toHaveBeenCalledWith(
      'defaultIndex',
      'wazuh-events-*',
    );
  });

  it('should NOT set defaultIndex when it already exists', async () => {
    const { context, savedObjectsClient, uiSettingsClient } =
      createMockContext('existing-id');
    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPattern({
      taskName: 'test-task',
      indexPatternID: 'wazuh-events-*',
      options: { checkDefaultIndexPattern: true },
    });

    await task.run({ context, logger: mockLogger });

    expect(uiSettingsClient.get).toHaveBeenCalledWith('defaultIndex');
    expect(uiSettingsClient.set).not.toHaveBeenCalled();
  });

  it('should NOT check defaultIndex when option is not enabled', async () => {
    const { context, savedObjectsClient, uiSettingsClient } =
      createMockContext(undefined);
    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-metrics-agents*',
      attributes: { title: 'wazuh-metrics-agents*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPattern({
      taskName: 'test-task',
      indexPatternID: 'wazuh-metrics-agents*',
      options: {},
    });

    await task.run({ context, logger: mockLogger });

    expect(uiSettingsClient.get).not.toHaveBeenCalled();
    expect(uiSettingsClient.set).not.toHaveBeenCalled();
  });
});

describe('initializationTaskCreatorIndexPattern - known fields lazy loading', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    get: jest.fn().mockReturnThis(),
  };

  const createMockContext = () => {
    const savedObjectsClient = {
      get: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };

    return {
      context: {
        logger: mockLogger,
        scope: ['internal'],
        services: {
          core: {
            savedObjects: {
              createInternalRepository: jest
                .fn()
                .mockReturnValue(savedObjectsClient),
            },
            opensearch: {
              legacy: { client: { callAsInternalUser: jest.fn() } },
            },
          },
        },
      },
      savedObjectsClient,
    };
  };

  beforeEach(() => jest.restoreAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('reads the known fields file from disk only when the index pattern is created', async () => {
    const knownFields = [{ name: '@timestamp', type: 'date' }];
    const readFileSpy = jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue(JSON.stringify(knownFields));

    const { context, savedObjectsClient } = createMockContext();
    // Index pattern does not exist yet -> creation path is taken
    savedObjectsClient.get.mockRejectedValue({ output: { statusCode: 404 } });
    savedObjectsClient.create.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: JSON.stringify(knownFields) },
    });

    const task = initializationTaskCreatorIndexPattern({
      taskName: 'test-task',
      indexPatternID: 'wazuh-events-*',
      options: { fieldsNoIndicesFilePath: '/known-fields/events.json' },
    });

    await task.run({ context, logger: mockLogger });

    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(readFileSpy).toHaveBeenCalledWith('/known-fields/events.json', 'utf8');
    // The fields parsed from disk are forwarded to the saved object creation
    expect(savedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      expect.objectContaining({ fields: JSON.stringify(knownFields) }),
      expect.any(Object),
    );
  });

  it('does NOT read the known fields file when the index pattern already exists', async () => {
    const readFileSpy = jest.spyOn(fs.promises, 'readFile');

    const { context, savedObjectsClient } = createMockContext();
    // Index pattern already exists -> creation path is skipped
    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPattern({
      taskName: 'test-task',
      indexPatternID: 'wazuh-events-*',
      options: { fieldsNoIndicesFilePath: '/known-fields/events.json' },
    });

    await task.run({ context, logger: mockLogger });

    expect(readFileSpy).not.toHaveBeenCalled();
    expect(savedObjectsClient.create).not.toHaveBeenCalled();
  });
});
