import React from 'react';
import {
  agentStatusColorByAgentStatus,
  agentStatusLabelByAgentStatus,
} from '../../../common/services/wz_agent_status';
import { ColumnWithStatusIcon } from './column-with-status-icon';
import { EuiIconTip } from '@elastic/eui';
import { AGENT_STATUS_CODE } from '../../../common/constants';
import '../../styles/common.scss';

export const AgentStatus = ({ status, children = null, style = {}, agent }) => {
  const statusCodeAgent = AGENT_STATUS_CODE.find(
    (status: StatusCodeAgent) => status.STATUS_CODE === agent?.status_code,
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
        anchorClassName='wz-margin-left-10'
        aria-label='Description'
        size='m'
        type='iInCircle'
        color='primary'
        content={statusCodeAgent?.STATUS_DESCRIPTION ?? 'Without information'}
      />
    </div>
  );
};
