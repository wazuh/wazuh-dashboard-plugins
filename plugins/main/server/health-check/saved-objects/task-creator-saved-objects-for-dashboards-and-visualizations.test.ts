import type { SavedObjectsClientContract } from 'opensearch_dashboards/server';
import { initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations } from './task-creator-saved-objects-for-dashboards-and-visualizations';
import type {
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';
import { readDashboardDefinitionFiles } from './dashboard-definition-reader';
import type { DashboardDefinitionFromFile } from './dashboard-definition-reader';
import type { InitializationTaskRunContext } from '../types';

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

    ctx = {
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
    } as unknown as InitializationTaskRunContext;

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

    expect(result).toEqual({ status: 'ok' });
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

    expect(result).toEqual({ status: 'ok' });
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
});
