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
                      index_patterns:
                        '[wazuh-alerts-5.x-*, wazuh-archives-5.x-*]',
                      order: '0',
                      version: '1',
                      composed_of: '',
                    },
                    {
                      name: 'wazuh-agent',
                      index_patterns: '[wazuh-monitoring*]',
                      order: '0',
                      version: null,
                      composed_of: '',
                    },
                    {
                      name: 'wazuh-statistics',
                      index_patterns: '[wazuh-statistics*]',
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
    ${'custom-wazuh-alerts-*'} | ${false}      | ${'Template was not found for [custom-wazuh-alerts-*]'}
    ${'wazuh-alerts-5.x-t*'}   | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-5.x-*'}    | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-5.x*'}     | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-5.*'}      | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-5*'}       | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-*'}        | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-'}         | ${true}       | ${['wazuh']}
    ${'wazuh-alerts'}          | ${true}       | ${['wazuh']}
    ${'wazuh-al'}              | ${true}       | ${['wazuh']}
    ${'wazuh-a'}               | ${true}       | ${['wazuh']}
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
      id: 'wazuh-monitoring-*',
      attributes: { title: 'wazuh-monitoring-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPattern({
      taskName: 'test-task',
      indexPatternID: 'wazuh-monitoring-*',
      options: {},
    });

    await task.run({ context, logger: mockLogger });

    expect(uiSettingsClient.get).not.toHaveBeenCalled();
    expect(uiSettingsClient.set).not.toHaveBeenCalled();
  });
});
