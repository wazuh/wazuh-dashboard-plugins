import fs from 'fs';
import { initializationTaskCreatorIndexPatternBatch } from './index-patterns';

describe('initializationTaskCreatorIndexPatternBatch', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    get: jest.fn().mockReturnThis(),
  };

  /**
   * Returns a ready-to-use task run context together with the mock clients so
   * individual tests can configure behaviour via `mockImplementation`.
   *
   * The top-level `services` on `runCtx` satisfies `PluginTaskRunContext`
   * (which extends `HealthCheckTaskContext`); the nested `context.services`
   * is the same reference, used by the actual task logic.
   */
  const createRunContext = (
    defaultIndex: string | null | undefined = undefined,
  ) => {
    const savedObjectsClient = {
      get: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };
    const uiSettingsClient = {
      get: jest.fn().mockResolvedValue(defaultIndex),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const services = {
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
    };
    const context = {
      logger: mockLogger,
      scope: 'internal' as const,
      services,
    };

    return {
      // Satisfies InitializationTaskRunContext (PluginTaskRunContext)
      runCtx: { context, logger: mockLogger, services },
      savedObjectsClient,
      uiSettingsClient,
    };
  };

  beforeEach(() => jest.clearAllMocks());

  it('should run all patterns and return flattened results', async () => {
    const { runCtx, savedObjectsClient } = createRunContext();

    savedObjectsClient.get.mockImplementation((_type: string, id: string) =>
      Promise.resolve({ id, attributes: { title: id, fields: '[]' } }),
    );

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize: 5,
      indexPatterns: [
        { taskName: 'task-a', indexPatternID: 'pattern-a*', options: {} },
        { taskName: 'task-b', indexPatternID: 'pattern-b*', options: {} },
        { taskName: 'task-c', indexPatternID: 'pattern-c*', options: {} },
      ],
    });

    const result = await task.run(runCtx);

    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        { id: 'pattern-a*', title: 'pattern-a*' },
        { id: 'pattern-b*', title: 'pattern-b*' },
        { id: 'pattern-c*', title: 'pattern-c*' },
      ]),
    );
  });

  it('should never exceed batchSize concurrent tasks', async () => {
    const { runCtx, savedObjectsClient } = createRunContext();

    const batchSize = 3;
    const totalPatterns = 10;
    let inFlight = 0;
    let maxObservedInFlight = 0;

    savedObjectsClient.get.mockImplementation(
      async (_type: string, id: string) => {
        inFlight++;
        maxObservedInFlight = Math.max(maxObservedInFlight, inFlight);
        // Simulate async work so tasks truly overlap within a batch
        await new Promise(resolve => setTimeout(resolve, 10));
        inFlight--;
        return { id, attributes: { title: id, fields: '[]' } };
      },
    );

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize,
      indexPatterns: Array.from({ length: totalPatterns }, (_, i) => ({
        taskName: `task-${i}`,
        indexPatternID: `pattern-${i}*`,
        options: {},
      })),
    });

    await task.run(runCtx);

    expect(maxObservedInFlight).toBeLessThanOrEqual(batchSize);
  });

  it('should process batches sequentially — batch N+1 starts only after batch N settles', async () => {
    const { runCtx, savedObjectsClient } = createRunContext();

    const completionOrder: string[] = [];

    savedObjectsClient.get.mockImplementation(
      async (_type: string, id: string) => {
        // 'slow*' takes longer; if batches ran concurrently it would finish
        // after batch-2 patterns, but sequential batching guarantees it finishes first.
        const delay = id.startsWith('slow') ? 50 : 5;
        await new Promise(resolve => setTimeout(resolve, delay));
        completionOrder.push(id);
        return { id, attributes: { title: id, fields: '[]' } };
      },
    );

    // Batch 1: [slow*, fast-b1*] — both must complete before batch 2 starts
    // Batch 2: [fast-b2a*, fast-b2b*]
    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize: 2,
      indexPatterns: [
        { taskName: 'task-slow', indexPatternID: 'slow*', options: {} },
        { taskName: 'task-b1', indexPatternID: 'fast-b1*', options: {} },
        { taskName: 'task-b2a', indexPatternID: 'fast-b2a*', options: {} },
        { taskName: 'task-b2b', indexPatternID: 'fast-b2b*', options: {} },
      ],
    });

    await task.run(runCtx);

    const batch1Done = Math.max(
      completionOrder.indexOf('slow*'),
      completionOrder.indexOf('fast-b1*'),
    );
    const batch2Start = Math.min(
      completionOrder.indexOf('fast-b2a*'),
      completionOrder.indexOf('fast-b2b*'),
    );
    expect(batch1Done).toBeLessThan(batch2Start);
  });

  it('should not abort remaining patterns when one fails, and throw an aggregated error', async () => {
    const { runCtx, savedObjectsClient } = createRunContext();

    savedObjectsClient.get.mockImplementation(
      async (_type: string, id: string) => {
        if (id === 'failing*') {
          throw Object.assign(new Error('Indexer unreachable'), {
            output: { statusCode: 500 },
          });
        }
        return { id, attributes: { title: id, fields: '[]' } };
      },
    );

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize: 5,
      indexPatterns: [
        { taskName: 'task-a', indexPatternID: 'pattern-a*', options: {} },
        { taskName: 'task-fail', indexPatternID: 'failing*', options: {} },
        { taskName: 'task-b', indexPatternID: 'pattern-b*', options: {} },
      ],
    });

    await expect(task.run(runCtx)).rejects.toThrow(
      /Some index patterns could not be initialized.*failing\*/,
    );

    // All patterns were attempted regardless of the failure
    const getCalls = savedObjectsClient.get.mock.calls.map(
      ([, id]: [unknown, string]) => id,
    );
    expect(getCalls).toContain('pattern-a*');
    expect(getCalls).toContain('pattern-b*');
    expect(getCalls).toContain('failing*');
  });

  it('should set defaultIndex when checkDefaultIndexPattern is true and default is null', async () => {
    const { runCtx, savedObjectsClient, uiSettingsClient } =
      createRunContext(null);

    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize: 5,
      indexPatterns: [
        {
          taskName: 'task-events',
          indexPatternID: 'wazuh-events-*',
          options: { checkDefaultIndexPattern: true },
        },
      ],
    });

    await task.run(runCtx);

    expect(uiSettingsClient.get).toHaveBeenCalledWith('defaultIndex');
    expect(uiSettingsClient.set).toHaveBeenCalledWith(
      'defaultIndex',
      'wazuh-events-*',
    );
  });

  it('should NOT set defaultIndex when checkDefaultIndexPattern is true and default already exists', async () => {
    const { runCtx, savedObjectsClient, uiSettingsClient } =
      createRunContext('existing-id');

    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize: 5,
      indexPatterns: [
        {
          taskName: 'task-events',
          indexPatternID: 'wazuh-events-*',
          options: { checkDefaultIndexPattern: true },
        },
      ],
    });

    await task.run(runCtx);

    expect(uiSettingsClient.get).toHaveBeenCalledWith('defaultIndex');
    expect(uiSettingsClient.set).not.toHaveBeenCalled();
  });

  it('should return empty array when no patterns are provided', async () => {
    const { runCtx } = createRunContext();

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'index-patterns',
      batchSize: 5,
      indexPatterns: [],
    });

    const result = await task.run(runCtx);
    expect(result).toEqual([]);
  });
});

describe('initializationTaskCreatorIndexPatternBatch - known fields lazy loading', () => {
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

    const services = {
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
    };

    return {
      context: {
        logger: mockLogger,
        scope: 'internal' as const,
        services,
      },
      services,
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

    const { context, services, savedObjectsClient } = createMockContext();
    // Index pattern does not exist yet -> creation path is taken
    savedObjectsClient.get.mockRejectedValue({ output: { statusCode: 404 } });
    savedObjectsClient.create.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: {
        title: 'wazuh-events-*',
        fields: JSON.stringify(knownFields),
      },
    });

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'test-task',
      batchSize: 1,
      indexPatterns: [
        {
          taskName: 'test-task',
          indexPatternID: 'wazuh-events-*',
          options: { fieldsNoIndicesFilePath: '/known-fields/events.json' },
        },
      ],
    });

    await task.run({ context, logger: mockLogger, services });

    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(readFileSpy).toHaveBeenCalledWith(
      '/known-fields/events.json',
      'utf8',
    );
    // The fields parsed from disk are forwarded to the saved object creation
    expect(savedObjectsClient.create).toHaveBeenCalledWith(
      'index-pattern',
      expect.objectContaining({ fields: JSON.stringify(knownFields) }),
      expect.any(Object),
    );
  });

  it('does NOT read the known fields file when the index pattern already exists', async () => {
    const readFileSpy = jest.spyOn(fs.promises, 'readFile');

    const { context, services, savedObjectsClient } = createMockContext();
    // Index pattern already exists -> creation path is skipped
    savedObjectsClient.get.mockResolvedValue({
      id: 'wazuh-events-*',
      attributes: { title: 'wazuh-events-*', fields: '[]' },
    });

    const task = initializationTaskCreatorIndexPatternBatch({
      taskName: 'test-task',
      batchSize: 1,
      indexPatterns: [
        {
          taskName: 'test-task',
          indexPatternID: 'wazuh-events-*',
          options: { fieldsNoIndicesFilePath: '/known-fields/events.json' },
        },
      ],
    });

    await task.run({ context, logger: mockLogger, services });

    expect(readFileSpy).not.toHaveBeenCalled();
    expect(savedObjectsClient.create).not.toHaveBeenCalled();
  });
});
