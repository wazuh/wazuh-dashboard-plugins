import {
  UI_LOGGER_LEVELS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../common/constants';
import {
  agentStatusLabelByAgentStatus,
  agentStatusColorByAgentStatus,
} from '../../../../common/services/wz_agent_status';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { WzRequest } from '../../../react-services/wz-request';

export const getSummaryAgentsStatus = async () => {
  try {
    const AGENT_STATUS = UI_ORDER_AGENT_STATUS.map(agentStatus => ({
      status: agentStatus,
      label: agentStatusLabelByAgentStatus(agentStatus),
      color: agentStatusColorByAgentStatus(agentStatus),
    }));
    const {
      data: {
        data: { connection: agentStatusSummary },
      },
    }: any = await WzRequest.apiReq('GET', '/agents/summary/status', {});

    return AGENT_STATUS.map(({ label, status, color }) => ({
      status,
      label: label,
      value: agentStatusSummary[status] || 0,
      color: color,
    }));
  } catch (error) {
    const options = {
      context: `EndpointsSummary.getSummary`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Could not get agents summary`,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
};
