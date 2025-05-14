import { getAgentsInfo } from './get-agents-info';
import { WzRequest } from '../../../react-services/wz-request';
import { getColorPaletteByIndex } from './get-color-palette-by-index';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import {
  agentStatusLabelByAgentStatus,
  agentStatusColorByAgentStatus,
} from '../../../../common/services/wz_agent_status';

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

jest.mock('../../../../common/services/wz_agent_status', () => ({
  agentStatusLabelByAgentStatus: jest.fn(),
  agentStatusColorByAgentStatus: jest.fn(),
}));

describe('getAgents', () => {
  it('should return grouped data', async () => {
    const responseData = {
      data: {
        status: {
          active: 24,
          disconnected: 0,
          never_connected: 11,
          pending: 15,
        },
        os: {
          debian: 45,
          ubuntu: 4,
          windows: 1,
        },
        groups: {
          default: 1,
          test: 2,
          test2: 3,
        },
      },
      error: 0,
    };
    const expectedGroupedData = {
      osData: [
        { label: 'debian', value: 45, color: 'mockColor1' },
        { label: 'ubuntu', value: 4, color: 'mockColor2' },
        { label: 'windows', value: 1, color: 'mockColor3' },
      ],
      groupsData: [
        { label: 'default', value: 1, color: 'mockColor1' },
        { label: 'test', value: 2, color: 'mockColor2' },
        { label: 'test2', value: 3, color: 'mockColor3' },
      ],
      statusData: [
        {
          status: 'active',
          label: 'ACTIVE',
          value: 24,
          color: 'mockColoractive',
        },
        {
          status: 'disconnected',
          label: 'DISCONNECTED',
          value: 0,
          color: 'mockColordisconnected',
        },
        {
          status: 'pending',
          label: 'PENDING',
          value: 15,
          color: 'mockColorpending',
        },
        {
          status: 'never_connected',
          label: 'NEVER_CONNECTED',
          value: 11,
          color: 'mockColornever_connected',
        },
      ],
    };

    (WzRequest.apiReq as jest.Mock).mockResolvedValue(responseData);

    (agentStatusLabelByAgentStatus as jest.Mock).mockImplementation(
      (label: string) => {
        return label.toUpperCase();
      },
    );

    (agentStatusColorByAgentStatus as jest.Mock).mockImplementation(
      (label: string) => {
        return `mockColor${label}`;
      },
    );

    (getColorPaletteByIndex as jest.Mock).mockImplementation(
      (index: number) => {
        return `mockColor${index + 1}`;
      },
    );

    const groupedData = await getAgentsInfo();

    expect(groupedData).toEqual(expectedGroupedData);
  });

  it('should handle error', async () => {
    const mockError = new Error('Mock error');

    (WzRequest.apiReq as jest.Mock).mockRejectedValue(mockError);

    const mockHandleError = jest.fn();
    (getErrorOrchestrator as jest.Mock).mockReturnValue({
      handleError: mockHandleError,
    });

    const groupedData = await getAgentsInfo();

    expect(groupedData).toEqual({
      osData: [],
      groupsData: [],
      statusData: [],
    });
    expect(mockHandleError).toHaveBeenCalledWith({
      context: 'EndpointsSummary.getSummary',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: mockError,
        message: mockError.message || mockError,
        title: 'Could not get agents info',
      },
    });
  });
});
