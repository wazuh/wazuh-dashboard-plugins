import React from 'react';
import {
  agentStatusColorByAgentStatus,
  agentStatusLabelByAgentStatus,
} from '../../../common/services/wz_agent_status';
import { ColumnWithStatusIcon } from './column-with-status-icon';

export const AgentStatus = ({ status, children = null, style = {} }) => (
  <span
    className='euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow'
    style={style}
  >
    <ColumnWithStatusIcon
      text={children || agentStatusLabelByAgentStatus(status).toLowerCase()}
      color={agentStatusColorByAgentStatus(status)}
      tooltip={agentStatusLabelByAgentStatus(status).toLowerCase()}
    />
  </span>
);
