import { getAgentsByGroup } from './get-agents-by-group';
import { WzRequest } from '../../../react-services/wz-request';
import { getColorPaletteByIndex } from './get-color-palette-by-index';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';

jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

jest.mock('./get-color-palette-by-index', () => ({
  getColorPaletteByIndex: jest.fn(),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: jest.fn(),
}));

describe('Get agents by group', () => {
  it('should return grouped data', async () => {
    const responseData = {
      data: {
        data: {
          affected_items: [
            {
              count: 2,
              group: ['group1'],
            },
            {
              count: 1,
              group: ['group2'],
            },
            {
              count: 4,
              group: ['group1', 'group2'],
            },
          ],
          total_affected_items: 3,
          total_failed_items: 0,
          failed_items: [],
        },
        message: 'All selected agents information was returned',
        error: 0,
      },
    };
    const expectedGroupedData = [
      { label: 'group1', value: 6, color: 'mockColor1' },
      { label: 'group2', value: 5, color: 'mockColor2' },
    ];

    (WzRequest.apiReq as jest.Mock).mockResolvedValue(responseData);

    (getColorPaletteByIndex as jest.Mock).mockImplementation(
      (index: number) => {
        return `mockColor${index + 1}`;
      },
    );

    const groupedData = await getAgentsByGroup();

    expect(groupedData).toEqual(expectedGroupedData);
  });

  it('should handle error', async () => {
    const mockError = new Error('Mock error');

    (WzRequest.apiReq as jest.Mock).mockRejectedValue(mockError);

    const mockHandleError = jest.fn();
    (getErrorOrchestrator as jest.Mock).mockReturnValue({
      handleError: mockHandleError,
    });

    const groupedData = await getAgentsByGroup();

    expect(groupedData).toEqual([]);
    expect(mockHandleError).toHaveBeenCalledWith({
      context: 'EndpointsSummary.getSummary',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: mockError,
        message: mockError.message || mockError,
        title: 'Could not get agents summary',
      },
    });
  });
});
