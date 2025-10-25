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
  SavedDashboardSO,
} from './dashboard-container-service';
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

    test('should handle dashboard without description', () => {
      const savedDashboard: SavedDashboardSO = {
        id: 'dashboard-1',
        type: 'dashboard',
        attributes: {
          title: 'Test Dashboard',
          panelsJSON: JSON.stringify([]),
          optionsJSON: JSON.stringify({
            useMargins: false,
            hidePanelTitles: true,
          }),
        },
        references: [],
      };

      const result = toByValueInput(savedDashboard);

      expect(result.description).toBeUndefined();
      expect(result.useMargins).toBe(false);
      expect(result.hidePanelTitles).toBe(true);
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

    test('should successfully build dashboard by-value input', async () => {
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

      (SavedObject.existsDashboard as jest.Mock).mockResolvedValue({ status: true });
      (SavedObject.getDashboardById as jest.Mock).mockResolvedValue({ data: mockDashboard });

      const result = await buildDashboardByValueInput('dashboard-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe('ready');
      expect(result.dashboardTitle).toBe('Test Dashboard');
      expect(result.byValueInput).toBeDefined();
      expect(result.byValueInput?.title).toBe('Test Dashboard');
      expect(result.byValueInput?.id).toBe('dashboard-1');
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