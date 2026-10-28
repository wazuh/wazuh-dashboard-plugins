import React from 'react';
import { i18n } from '@osd/i18n';
import {
  agentStatusColorByAgentStatus,
  agentStatusDescriptionByAgentStatus,
  agentStatusLabelByAgentStatus,
  TAgentStatus,
} from '../../../common/services/wz_agent_status';
import { ColumnWithStatusIcon } from './column-with-status-icon';
import { EuiIconTip } from '@elastic/eui';
import {
  AGENT_STATUS_CODE,
  API_NAME_AGENT_STATUS,
} from '../../../common/constants';
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
  const label = agentStatusLabelByAgentStatus(status);
  const description = agentStatusDescriptionByAgentStatus(status);
  return (
    <div
      className='euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow'
      style={style}
    >
      <ColumnWithStatusIcon
        text={children || label.toLowerCase()}
        color={agentStatusColorByAgentStatus(status)}
        tooltip={description ?? label.toLowerCase()}
        tooltipTitle={description ? label : undefined}
      />
      <EuiIconTip
        anchorClassName='wz-agent-icon-tip'
        aria-label={i18n.translate(
          'wazuh.endpointsSummary.agentStatus.descriptionAriaLabel',
          { defaultMessage: 'Description' },
        )}
        size='m'
        type='iInCircle'
        color='primary'
        content={
          <>
            {description && <p>{description}</p>}
            {/* The manager reports code 0 for agents that never connected */}
            {status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED && (
              <p>
                {i18n.translate(
                  'wazuh.endpointsSummary.agentStatus.lastChange',
                  {
                    defaultMessage: 'Last change: {reason}',
                    values: {
                      reason:
                        statusCodeAgent?.STATUS_DESCRIPTION ??
                        i18n.translate(
                          'wazuh.endpointsSummary.agentStatus.withoutInformation',
                          { defaultMessage: 'Without information' },
                        ),
                    },
                  },
                )}
              </p>
            )}
          </>
        }
      />
    </div>
  );
};
