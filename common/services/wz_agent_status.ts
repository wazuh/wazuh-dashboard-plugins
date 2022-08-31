import { UI_COLOR_AGENT_STATUS, UI_LABEL_NAME_AGENT_STATUS, API_NAME_AGENT_STATUS } from '../constants';

type TAgentStatus = typeof API_NAME_AGENT_STATUS[keyof typeof API_NAME_AGENT_STATUS];

type TAgentStatusColor = typeof UI_COLOR_AGENT_STATUS[keyof typeof UI_COLOR_AGENT_STATUS];
type TAgentStatusLabel = typeof UI_LABEL_NAME_AGENT_STATUS[keyof typeof UI_LABEL_NAME_AGENT_STATUS];

export function agentStatusColorByAgentStatus(status: TAgentStatus): TAgentStatusColor{
    return UI_COLOR_AGENT_STATUS[status] || UI_COLOR_AGENT_STATUS.default;
}

export function agentStatusLabelByAgentStatus(status: TAgentStatus): TAgentStatusLabel{
    return UI_LABEL_NAME_AGENT_STATUS[status] || UI_LABEL_NAME_AGENT_STATUS.default;
}