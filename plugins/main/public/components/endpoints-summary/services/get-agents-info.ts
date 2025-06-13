/* eslint-disable */
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

/* eslint-enable */
export interface IAgentsSummaryResponse {
  status: {
    active: number;
    disconnected: number;
    never_connected: number;
    pending: number;
  };
  os: {
    [key: string]: number;
  };
  groups: {
    [key: string]: number;
  };
}

interface AgentDataItem {
  label: string;
  value: number;
  color: string;
  status?: string;
}

interface AgentsInfoResult {
  osData: AgentDataItem[];
  groupsData: AgentDataItem[];
  statusData: AgentDataItem[];
}

export const getAgentsInfo = async (): Promise<AgentsInfoResult> => {
  const DEFAULT_COUNT = 1;
  const agentsInfoEmpty: AgentsInfoResult = {
    osData: [],
    groupsData: [],
    statusData: [],
  };

  try {
    const apiResponse = await WzRequest.apiReq('GET', '/agents/summary', {});
    const agentSummaryData = apiResponse?.data?.data as IAgentsSummaryResponse;

    if (!agentSummaryData) {
      return agentsInfoEmpty;
    }

    const osData: AgentDataItem[] = [];
    const groupsData: AgentDataItem[] = [];

    const AGENT_STATUS = UI_ORDER_AGENT_STATUS.map(agentStatus => ({
      status: agentStatus,
      label: agentStatusLabelByAgentStatus(agentStatus),
      color: agentStatusColorByAgentStatus(agentStatus),
    }));

    Object.entries(agentSummaryData.os || {}).forEach(
      ([osName, count], index) => {
        osData.push({
          label: osName,
          value: count ?? DEFAULT_COUNT,
          color: getColorPaletteByIndex(index),
        });
      },
    );

    Object.entries(agentSummaryData.groups || {}).forEach(
      ([groupName, count], index) => {
        groupsData.push({
          label: groupName,
          value: count ?? DEFAULT_COUNT,
          color: getColorPaletteByIndex(index),
        });
      },
    );

    const statusData = AGENT_STATUS.map(({ label, status, color }) => ({
      status,
      label,
      value: agentSummaryData.status?.[status] ?? 0,
      color,
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
        message: error?.message || error,
        title: 'Could not get agents info',
      },
    };
    getErrorOrchestrator().handleError(options);
    return agentsInfoEmpty;
  }
};
