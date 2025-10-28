/**
 * Unit tests for dashboard-container-service.ts
 * These tests cover the methods used by dashboard-container.tsx component
 */

// @ts-nocheck
/* eslint-disable */

// Mock the SavedObject service before importing
jest.mock('../../../../react-services/saved-objects', () => ({
  SavedObject: {
    existsDashboard: jest.fn(),
    getDashboardById: jest.fn(),
  },
}));

import {
  buildDashboardByValueInput,
  toByValueInput,
  transformPanelsJSON,
} from './dashboard-container-service';
import { SavedDashboardSO, DashboardConfigInput } from './types';
import { SavedObject } from '../../../../react-services/saved-objects';

describe('Dashboard Container Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('transformPanelsJSON', () => {
    test('should transform panels JSON correctly', () => {
      const panelsJSON = JSON.stringify([
        {
          gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
          panelIndex: '1',
          panelRefName: 'panel_1',
          type: 'visualization',
        },
        {
          gridData: { x: 24, y: 0, w: 24, h: 15, i: '2' },
          panelIndex: '2',
          panelRefName: 'panel_2',
        },
      ]);

      const references = [
        { name: 'panel_1', type: 'visualization', id: 'vis-1' },
        { name: 'panel_2', type: 'visualization', id: 'vis-2' },
      ];

      const result = transformPanelsJSON(panelsJSON, references);

      expect(result).toEqual({
        '1': {
          gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
          type: 'visualization',
          explicitInput: {
            id: '1',
            savedObjectId: 'vis-1',
          },
        },
        '2': {
          gridData: { x: 24, y: 0, w: 24, h: 15, i: '2' },
          type: 'visualization',
          explicitInput: {
            id: '2',
            savedObjectId: 'vis-2',
          },
        },
      });
    });

    test('should handle panels without type (defaults to visualization)', () => {
      const panelsJSON = JSON.stringify([
        {
          gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
          panelIndex: '1',
          panelRefName: 'panel_1',
        },
      ]);

      const references = [
        { name: 'panel_1', type: 'visualization', id: 'vis-1' },
      ];

      const result = transformPanelsJSON(panelsJSON, references);

      expect(result['1'].type).toBe('visualization');
    });

    test('should handle empty panels JSON', () => {
      const panelsJSON = JSON.stringify([]);
      const references: any[] = [];

      const result = transformPanelsJSON(panelsJSON, references);

      expect(result).toEqual({});
    });
  });

  describe('toByValueInput', () => {
    test('should convert saved dashboard object to by-value input', () => {
      const savedDashboard: SavedDashboardSO = {
        id: 'dashboard-1',
        type: 'dashboard',
        attributes: {
          title: 'Test Dashboard',
          description: 'Test Description',
          panelsJSON: JSON.stringify([
            {
              gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
              panelIndex: '1',
              panelRefName: 'panel_1',
              type: 'visualization',
            },
          ]),
          optionsJSON: JSON.stringify({
            useMargins: true,
            hidePanelTitles: false,
          }),
        },
        references: [
          { name: 'panel_1', type: 'visualization', id: 'vis-1' },
        ],
      };

      const result = toByValueInput(savedDashboard);

      expect(result.title).toBe('Test Dashboard');
      expect(result.description).toBe('Test Description');
      expect(result.id).toBe('dashboard-1');
      expect(result.viewMode).toBe('view');
      expect(result.isFullScreenMode).toBe(false);
      expect(result.panels['1']).toBeDefined();
      expect(result.panels['1'].type).toBe('visualization');
      expect(result.panels['1'].explicitInput.savedObjectId).toBe('vis-1');
    });

    test('should convert saved dashboard object to by-value input with config override', () => {
      const savedDashboard: SavedDashboardSO = {
        id: 'dashboard-1',
        type: 'dashboard',
        attributes: {
          title: 'Original Title',
          description: 'Original Description',
          panelsJSON: JSON.stringify([
            {
              gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
              panelIndex: '1',
              panelRefName: 'panel_1',
              type: 'visualization',
            },
          ]),
          optionsJSON: JSON.stringify({
            useMargins: false,
            hidePanelTitles: true,
          }),
        },
        references: [
          { name: 'panel_1', type: 'visualization', id: 'vis-1' },
        ],
      };

      const config: DashboardConfigInput = {
        title: 'Config Title',
        description: 'Config Description',
        dataSource: {
          fetchFilters: [{ meta: { key: 'test' } }],
          searchBarProps: {
            query: 'test query',
            dateRangeFrom: '2024-01-01T00:00:00.000Z',
            dateRangeTo: '2024-12-31T23:59:59.999Z',
          },
          fingerprint: 1234567890,
        },
        useMargins: true,
        hidePanelTitles: false,
        viewMode: 'edit' as const,
        isFullScreenMode: true,
        refreshConfig: { pause: true, value: 30 },
      };

      const result = toByValueInput(savedDashboard, config);

      expect(result.title).toBe('Config Title');
      expect(result.description).toBe('Config Description');
      expect(result.useMargins).toBe(true);
      expect(result.hidePanelTitles).toBe(false);
      expect(result.viewMode).toBe('edit');
      expect(result.isFullScreenMode).toBe(true);
      expect(result.filters).toEqual([{ meta: { key: 'test' } }]);
      expect(result.query).toBe('test query');
      expect(result.refreshConfig).toEqual({ pause: true, value: 30 });
      expect(result.timeRange).toEqual({
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
      });
      expect(result.lastReloadRequestTime).toBe(1234567890);
    });

    test('should use default values when config is not provided', () => {
      const savedDashboard: SavedDashboardSO = {
        id: 'dashboard-1',
        type: 'dashboard',
        attributes: {
          title: 'Test Dashboard',
          description: 'Test Description',
          panelsJSON: JSON.stringify([]),
          optionsJSON: JSON.stringify({
            useMargins: true,
            hidePanelTitles: false,
          }),
        },
        references: [],
      };

      const result = toByValueInput(savedDashboard);

      expect(result.title).toBe('Test Dashboard');
      expect(result.description).toBe('Test Description');
      expect(result.viewMode).toBe('view');
      expect(result.isFullScreenMode).toBe(false);
      expect(result.filters).toEqual([]);
      expect(result.query).toBe('');
      expect(result.refreshConfig).toEqual({ pause: false, value: 15 });
      expect(result.timeRange).toEqual(undefined);
      expect(result.lastReloadRequestTime).toBeUndefined();
    });

    test('should handle partial config object', () => {
      const savedDashboard: SavedDashboardSO = {
        id: 'dashboard-1',
        type: 'dashboard',
        attributes: {
          title: 'Original Title',
          description: 'Original Description',
          panelsJSON: JSON.stringify([]),
          optionsJSON: JSON.stringify({
            useMargins: false,
            hidePanelTitles: true,
          }),
        },
        references: [],
      };

      const partialConfig: Partial<DashboardConfigInput> = {
        title: 'New Title',
        viewMode: 'edit' as const,
      };

      const result = toByValueInput(savedDashboard, partialConfig as DashboardConfigInput);

      expect(result.title).toBe('New Title');
      expect(result.description).toBe('Original Description'); // Should use original
      expect(result.viewMode).toBe('edit');
      expect(result.useMargins).toBe(false); // Should use original from optionsJSON
      expect(result.hidePanelTitles).toBe(true); // Should use original from optionsJSON
    });
  });

  describe('buildDashboardByValueInput', () => {
    test('should return error for invalid dashboard ID', async () => {
      const result = await buildDashboardByValueInput('');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.error).toBe('Dashboard ID is required.');
    });

    test('should return error for null dashboard ID', async () => {
      const result = await buildDashboardByValueInput(null as any);

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.error).toBe('Dashboard ID is required.');
    });

    test('should return error for whitespace-only dashboard ID', async () => {
      const result = await buildDashboardByValueInput('   ');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.error).toBe('Dashboard ID is required.');
    });

    test('should return not_found when dashboard does not exist', async () => {
      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue(null);

      const result = await buildDashboardByValueInput('non-existent-dashboard');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.error).toBe('Requested dashboard not found.');
    });

    test('should return not_found when existsDashboard returns invalid response', async () => {
      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue({ status: false });

      const result = await buildDashboardByValueInput('invalid-dashboard');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.error).toBe('Requested dashboard not found.');
    });

    test('should successfully build dashboard by-value input with config', async () => {
      const mockDashboard: SavedDashboardSO = {
        id: 'dashboard-1',
        type: 'dashboard',
        attributes: {
          title: 'Test Dashboard',
          description: 'Test Description',
          panelsJSON: JSON.stringify([
            {
              gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
              panelIndex: '1',
              panelRefName: 'panel_1',
              type: 'visualization',
            },
          ]),
          optionsJSON: JSON.stringify({
            useMargins: true,
            hidePanelTitles: false,
          }),
        },
        references: [
          { name: 'panel_1', type: 'visualization', id: 'vis-1' },
        ],
      };

      const config: DashboardConfigInput = {
        title: 'Custom Title',
        description: 'Custom Description',
        dataSource: {
          fetchFilters: [{ meta: { key: 'agent.id', value: '001' } }],
          searchBarProps: {
            query: 'status:active',
            dateRangeFrom: '2024-01-01T00:00:00.000Z',
            dateRangeTo: '2024-12-31T23:59:59.999Z',
          },
        },
        useMargins: false,
        hidePanelTitles: true,
        viewMode: 'edit' as const,
        isFullScreenMode: true,
        refreshConfig: { pause: false, value: 60 },
      };

      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue({ status: true });
      (SavedObject.getDashboardById as jest.Mock).mockResolvedValue({ data: mockDashboard });

      const result = await buildDashboardByValueInput('dashboard-1', config);

      expect(result.success).toBe(true);
      expect(result.status).toBe('ready');
      expect(result.dashboardTitle).toBe('Test Dashboard');
      expect(result.byValueInput).toBeDefined();
      expect(result.byValueInput?.title).toBe('Custom Title');
      expect(result.byValueInput?.description).toBe('Custom Description');
      expect(result.byValueInput?.viewMode).toBe('edit');
      expect(result.byValueInput?.isFullScreenMode).toBe(true);
      expect(result.byValueInput?.useMargins).toBe(false);
      expect(result.byValueInput?.hidePanelTitles).toBe(true);
      expect(result.byValueInput?.filters).toEqual([{ meta: { key: 'agent.id', value: '001' } }]);
      expect(result.byValueInput?.query).toBe('status:active');
      expect(result.byValueInput?.refreshConfig).toEqual({ pause: false, value: 60 });
      expect(result.byValueInput?.timeRange).toEqual({
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
      });
    });

    test('should handle errors during dashboard fetching', async () => {
      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue({ status: true });
      (SavedObject.getDashboardById as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await buildDashboardByValueInput('dashboard-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    test('should handle errors without message', async () => {
      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue({ status: true });
      (SavedObject.getDashboardById as jest.Mock).mockRejectedValue({});

      const result = await buildDashboardByValueInput('dashboard-1');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Error building dashboard input.');
    });

    test('should call SavedObject methods with correct parameters', async () => {
      const dashboardId = 'test-dashboard-id';
      
      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue({ status: true });
      (SavedObject.getDashboardById as jest.Mock).mockResolvedValue({
        data: {
          id: dashboardId,
          type: 'dashboard',
          attributes: {
            title: 'Test',
            panelsJSON: '[]',
            optionsJSON: '{}',
          },
          references: [],
        },
      });

      await buildDashboardByValueInput(dashboardId);

      expect(SavedObject.existsDashboard).toHaveBeenCalledWith(dashboardId);
      expect(SavedObject.getDashboardById).toHaveBeenCalledWith(dashboardId);
    });
  });
});