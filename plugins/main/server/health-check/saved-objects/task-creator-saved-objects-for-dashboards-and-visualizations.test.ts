import type { SavedObjectsClientContract } from 'opensearch_dashboards/server';
import { initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations } from './task-creator-saved-objects-for-dashboards-and-visualizations';
import type {
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';
import { readDashboardDefinitionFiles } from './dashboard-definition-reader';
import type { DashboardDefinitionFromFile } from './dashboard-definition-reader';
import type { InitializationTaskRunContext } from '../types';
import {
  TASK_RESULT,
  withTaskResult,
} from '../../mocks/health-check-task-context.mock';

jest.mock('./dashboard-definition-reader', () => ({
  readDashboardDefinitionFiles: jest.fn(),
}));

const mockReadDashboardDefinitionFiles =
  readDashboardDefinitionFiles as jest.MockedFunction<
    typeof readDashboardDefinitionFiles
  >;

const createLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const mockVisualization: SavedObjectVisualization = {
  id: 'vis-1',
  type: 'visualization',
  attributes: {
    title: 'Visualization 1',
    kibanaSavedObjectMeta: { searchSourceJSON: '{}' },
    uiStateJSON: '{}',
    visState: '{}',
  },
  references: [],
};

const mockDashboard: SavedObjectDashboard = {
  id: 'dash-1',
  type: 'dashboard',
  attributes: {
    title: 'Dashboard 1',
    kibanaSavedObjectMeta: { searchSourceJSON: '{}' },
    hits: 0,
    optionsJSON: '{}',
    panelsJSON: '[]',
    timeRestore: false,
  },
  references: [],
};

const mockDefinition: DashboardDefinitionFromFile = {
  filePath: '/fake/dashboard.ndjson',
  relativeFilePath: 'fake/dashboard.ndjson',
  dashboard: mockDashboard,
  visualizations: [mockVisualization],
};

describe('initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations', () => {
  let mockClient: jest.Mocked<SavedObjectsClientContract>;
  let mockCreateInternalRepository: jest.Mock;
  let ctx: InitializationTaskRunContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      create: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<SavedObjectsClientContract>;
    mockCreateInternalRepository = jest.fn(() => mockClient);

    ctx = withTaskResult({
      logger: createLogger(),
      context: {
        services: {
          core: {
            savedObjects: {
              createInternalRepository: mockCreateInternalRepository,
            },
          },
        },
      },
    }) as unknown as InitializationTaskRunContext;

    mockReadDashboardDefinitionFiles.mockReturnValue([mockDefinition]);
  });

  it('creates the required visualizations and dashboard when they are missing (internal-scheduled)', async () => {
    ctx.context.scope = 'internal-scheduled';
    mockClient.get.mockRejectedValue({ output: { statusCode: 404 } });
    mockClient.create
      .mockResolvedValueOnce(mockVisualization)
      .mockResolvedValueOnce(mockDashboard);

    const task =
      initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
    const result = await task.run(ctx);

    expect(result).toEqual({
      [TASK_RESULT]: true,
      status: 'ok',
      data: undefined,
    });
    expect(mockCreateInternalRepository).toHaveBeenCalledTimes(1);
    expect(mockReadDashboardDefinitionFiles).toHaveBeenCalledTimes(1);
    expect(mockClient.get).toHaveBeenCalledWith(
      'visualization',
      mockVisualization.id,
    );
    expect(mockClient.get).toHaveBeenCalledWith('dashboard', mockDashboard.id);
    expect(mockClient.create).toHaveBeenCalledWith(
      'visualization',
      { ...mockVisualization.attributes, description: 'Provided by Wazuh. ' },
      {
        id: mockVisualization.id,
        overwrite: false,
        refresh: true,
        references: mockVisualization.references,
      },
    );
    expect(mockClient.create).toHaveBeenCalledWith(
      'dashboard',
      { ...mockDashboard.attributes, description: 'Provided by Wazuh. ' },
      {
        id: mockDashboard.id,
        overwrite: false,
        refresh: true,
        references: mockDashboard.references,
      },
    );

    expect(ctx.logger.debug).toHaveBeenCalledWith(
      'Saved objects provisioning finished',
    );
  });

  it('overwrites the visualizations and dashboard without checking existence (internal-initial)', async () => {
    ctx.context.scope = 'internal-initial';
    mockClient.create
      .mockResolvedValueOnce(mockVisualization)
      .mockResolvedValueOnce(mockDashboard);

    const task =
      initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
    const result = await task.run(ctx);

    expect(result).toEqual({
      [TASK_RESULT]: true,
      status: 'ok',
      data: undefined,
    });
    expect(mockCreateInternalRepository).toHaveBeenCalledTimes(1);
    expect(mockClient.get).not.toHaveBeenCalled();
    expect(mockClient.create).toHaveBeenCalledWith(
      'visualization',
      { ...mockVisualization.attributes, description: 'Provided by Wazuh. ' },
      {
        id: mockVisualization.id,
        overwrite: true,
        refresh: true,
        references: mockVisualization.references,
      },
    );
    expect(mockClient.create).toHaveBeenCalledWith(
      'dashboard',
      { ...mockDashboard.attributes, description: 'Provided by Wazuh. ' },
      {
        id: mockDashboard.id,
        overwrite: true,
        refresh: true,
        references: mockDashboard.references,
      },
    );
  });

  describe('"Provided by Wazuh. " description prefix normalization', () => {
    const getCreatedAttributes = (type: 'visualization' | 'dashboard') => {
      const call = mockClient.create.mock.calls.find(([t]) => t === type);
      return call?.[1] as { description?: string };
    };

    beforeEach(() => {
      ctx.context.scope = 'internal-initial';
      mockClient.create.mockResolvedValue(mockDashboard);
    });

    it('adds the prefix when the description is missing', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([mockDefinition]);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      await task.run(ctx);

      expect(getCreatedAttributes('visualization').description).toBe(
        'Provided by Wazuh. ',
      );
      expect(getCreatedAttributes('dashboard').description).toBe(
        'Provided by Wazuh. ',
      );
    });

    it('prepends the prefix to an existing description', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([
        {
          ...mockDefinition,
          dashboard: {
            ...mockDashboard,
            attributes: {
              ...mockDashboard.attributes,
              description: 'HIPAA overview dashboard',
            },
          },
          visualizations: [],
        },
      ]);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      await task.run(ctx);

      expect(getCreatedAttributes('dashboard').description).toBe(
        'Provided by Wazuh. HIPAA overview dashboard',
      );
    });

    it('leaves an already-compliant description unchanged (idempotent)', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([
        {
          ...mockDefinition,
          dashboard: {
            ...mockDashboard,
            attributes: {
              ...mockDashboard.attributes,
              description: 'Provided by Wazuh. Already compliant',
            },
          },
          visualizations: [],
        },
      ]);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      await task.run(ctx);

      expect(getCreatedAttributes('dashboard').description).toBe(
        'Provided by Wazuh. Already compliant',
      );
    });
  });
  describe('write failures', () => {
    const secondDefinition: DashboardDefinitionFromFile = {
      filePath: '/fake/second.ndjson',
      relativeFilePath: 'fake/second.ndjson',
      dashboard: { ...mockDashboard, id: 'dash-2' },
      visualizations: [],
    };
    const unavailableError = Object.assign(new Error('Request timed out'), {
      output: { statusCode: 503 },
    });
    const badRequestError = Object.assign(
      new Error('mapper_parsing_exception'),
      {
        output: { statusCode: 400 },
      },
    );

    beforeEach(() => {
      ctx.context.scope = 'internal-initial';
      jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((callback: () => void) => {
          callback();
          return 0 as unknown as NodeJS.Timeout;
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('provisions the remaining files and reports the failed one', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([
        mockDefinition,
        secondDefinition,
      ]);
      mockClient.create.mockImplementation((type, attributes, options) =>
        options?.id === mockVisualization.id
          ? Promise.reject(badRequestError)
          : Promise.resolve({ ...mockDashboard, id: options?.id as string }),
      );

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      const result = await task.run(ctx);

      expect(mockClient.create).toHaveBeenCalledTimes(2);
      expect(mockClient.create).toHaveBeenCalledWith(
        'dashboard',
        expect.anything(),
        expect.objectContaining({ id: 'dash-2' }),
      );
      expect(mockClient.create).not.toHaveBeenCalledWith(
        'dashboard',
        expect.anything(),
        expect.objectContaining({ id: mockDashboard.id }),
      );
      expect(result).toEqual({
        [TASK_RESULT]: true,
        status: 'warning',
        message:
          'Could not provision 1 of 2 dashboard definition files. First error [fake/dashboard.ndjson]: mapper_parsing_exception',
        data: {
          failures: [
            {
              file: 'fake/dashboard.ndjson',
              error: 'mapper_parsing_exception',
            },
          ],
        },
      });
    });

    it('retries a transient error and succeeds', async () => {
      mockClient.create
        .mockRejectedValueOnce(unavailableError)
        .mockResolvedValueOnce(mockVisualization)
        .mockResolvedValueOnce(mockDashboard);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      const result = await task.run(ctx);

      expect(mockClient.create).toHaveBeenCalledTimes(3);
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        'Transient error [Request timed out], retrying in 1000ms',
      );
      expect(result).toEqual({
        [TASK_RESULT]: true,
        status: 'ok',
        data: undefined,
      });
    });

    it('gives up on a transient error after three retries', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([
        { ...mockDefinition, visualizations: [] },
      ]);
      mockClient.create.mockRejectedValue(unavailableError);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      const result = await task.run(ctx);

      expect(mockClient.create).toHaveBeenCalledTimes(4);
      expect(result).toEqual(
        expect.objectContaining({
          status: 'warning',
          data: {
            failures: [
              { file: 'fake/dashboard.ndjson', error: 'Request timed out' },
            ],
          },
        }),
      );
    });

    it('stops after a file keeps failing transiently and reports the rest as not attempted', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([
        { ...mockDefinition, visualizations: [] },
        { ...secondDefinition },
      ]);
      mockClient.create.mockRejectedValue(unavailableError);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      const result = await task.run(ctx);

      expect(mockClient.create).toHaveBeenCalledTimes(4);
      expect(mockClient.create).not.toHaveBeenCalledWith(
        'dashboard',
        expect.anything(),
        expect.objectContaining({ id: 'dash-2' }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          status: 'warning',
          message: expect.stringMatching(
            /^Could not provision 2 of 2 dashboard definition files/,
          ),
          data: {
            failures: [
              { file: 'fake/dashboard.ndjson', error: 'Request timed out' },
              {
                file: 'fake/second.ndjson',
                error: 'Not attempted: the indexer kept failing',
              },
            ],
          },
        }),
      );
    });

    it('does not retry a non-transient error', async () => {
      mockReadDashboardDefinitionFiles.mockReturnValue([
        { ...mockDefinition, visualizations: [] },
      ]);
      mockClient.create.mockRejectedValue(badRequestError);

      const task =
        initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations();
      await task.run(ctx);

      expect(mockClient.create).toHaveBeenCalledTimes(1);
      expect(ctx.logger.warn).not.toHaveBeenCalled();
    });
  });
});
