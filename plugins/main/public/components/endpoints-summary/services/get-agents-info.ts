import {
  UI_LOGGER_LEVELS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { WzRequest } from '../../../react-services/wz-request';
import { getColorPaletteByIndex } from './get-color-palette-by-index';
import {
  agentStatusLabelByAgentStatus,
  agentStatusColorByAgentStatus,
} from '../../../../common/services/wz_agent_status';

export const getAgentsInfo = async () => {
  const DEFAULT_COUNT = 1;
  try {
    // Uncomment before merge
    // const { data }: any = await WzRequest.apiReq('GET', '/decoders', '{}');

    // MOCK - TO DELETE BEFORE MERGE
    const responseMock = {
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

    const { data }: any = await new Promise(resolve => {
      setTimeout(() => {
        resolve(responseMock);
      }, 300);
    });

    // END OF MOCK - TO DELETE BEFORE MERGE

    const osData: any[] = [];
    const groupsData: any[] = [];

    const AGENT_STATUS = UI_ORDER_AGENT_STATUS.map(agentStatus => ({
      status: agentStatus,
      label: agentStatusLabelByAgentStatus(agentStatus),
      color: agentStatusColorByAgentStatus(agentStatus),
    }));

    Object.entries(data?.os).forEach(([osName, count], index) => {
      osData.push({
        label: osName,
        value: count ?? DEFAULT_COUNT,
        color: getColorPaletteByIndex(index),
      });
    });

    Object.entries(data?.groups).forEach(([groupName, count], index) => {
      groupsData.push({
        label: groupName,
        value: count ?? DEFAULT_COUNT,
        color: getColorPaletteByIndex(index),
      });
    });

    const statusData = AGENT_STATUS.map(({ label, status, color }) => ({
      status,
      label: label,
      value: data?.status[status] || 0,
      color: color,
    }));

    return {
      osData: osData.sort((a, b) => b.value - a.value).slice(0, 5),
      groupsData: groupsData.slice(0, 5),
      statusData,
    };
  } catch (error) {
    const options = {
      context: 'EndpointsSummary.getSummary',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Could not get agents info`,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
};
