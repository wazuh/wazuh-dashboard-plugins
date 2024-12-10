import React from 'react';
import {
  agentStatusColorByAgentStatus,
  agentStatusLabelByAgentStatus,
  TAgentStatus,
} from '../../../common/services/wz_agent_status';
import { ColumnWithStatusIcon } from './column-with-status-icon';
import { EuiIconTip } from '@elastic/eui';
import { AGENT_STATUS_CODE } from '../../../common/constants';
import '../../styles/common.scss';
import { Agent } from '../endpoints-summary/types';
import './agent-status.scss';

interface AgentStatusProps {
  status: TAgentStatus;
  children?: string | null;
  style?: React.CSSProperties;
  agent?: Agent;
}

export const AgentStatus = ({
  status,
  children,
  style = {},
  agent,
}: AgentStatusProps) => {
  const statusCodeAgent = AGENT_STATUS_CODE.find(
    status => status.STATUS_CODE === agent?.status_code,
  );
  return (
    <div
      className='euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow'
      style={style}
    >
      <ColumnWithStatusIcon
        text={children || agentStatusLabelByAgentStatus(status).toLowerCase()}
        color={agentStatusColorByAgentStatus(status)}
        tooltip={agentStatusLabelByAgentStatus(status).toLowerCase()}
      />
      <EuiIconTip
        anchorClassName='wz-agent-icon-tip'
        aria-label='Description'
        size='m'
        type='iInCircle'
        color='primary'
        content={statusCodeAgent?.STATUS_DESCRIPTION ?? 'Without information'}
      />
    </div>
  );
};
