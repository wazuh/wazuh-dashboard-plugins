import { UI_COLOR_AGENT_STATUS, UI_LABEL_NAME_AGENT_STATUS } from '../constants';

type AgentStatus = 'active' | 'disconected' | 'pending' | 'never_connected';

export function agentStatusColorByAgentStatus(status: AgentStatus): string{
    return UI_COLOR_AGENT_STATUS[status] || UI_COLOR_AGENT_STATUS.default;
}

export function agentStatusLabelByAgentStatus(status: AgentStatus): string{
    return UI_LABEL_NAME_AGENT_STATUS[status] || UI_LABEL_NAME_AGENT_STATUS.default;
}