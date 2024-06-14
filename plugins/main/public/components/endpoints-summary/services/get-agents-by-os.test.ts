import { getAgentsByOs } from './get-agents-by-os';
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

describe('getAgentsByOs', () => {
  it('should return grouped data', async () => {
    const responseData = {
      data: {
        data: {
          affected_items: [
            { os: { platform: 'Windows' }, count: 3 },
            { os: { platform: 'Linux' }, count: 2 },
            { os: { platform: 'Mac' }, count: 1 },
          ],
        },
      },
    };
    const expectedGroupedData = [
      { label: 'Windows', value: 3, color: 'mockColor1' },
      { label: 'Linux', value: 2, color: 'mockColor2' },
      { label: 'Mac', value: 1, color: 'mockColor3' },
    ];

    (WzRequest.apiReq as jest.Mock).mockResolvedValue(responseData);

    (getColorPaletteByIndex as jest.Mock).mockImplementation(
      (index: number) => {
        return `mockColor${index + 1}`;
      },
    );

    const groupedData = await getAgentsByOs();

    expect(groupedData).toEqual(expectedGroupedData);
  });

  it('should handle error', async () => {
    const mockError = new Error('Mock error');

    (WzRequest.apiReq as jest.Mock).mockRejectedValue(mockError);

    const mockHandleError = jest.fn();
    (getErrorOrchestrator as jest.Mock).mockReturnValue({
      handleError: mockHandleError,
    });

    const groupedData = await getAgentsByOs();

    expect(groupedData).toEqual([]);
    expect(mockHandleError).toHaveBeenCalledWith({
      context: 'EndpointsSummary.getSummary',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: mockError,
        message: mockError.message || mockError,
        title: 'Could not get agents by OS',
      },
    });
  });
});
