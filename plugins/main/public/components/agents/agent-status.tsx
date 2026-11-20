import React from 'react';
import moment from 'moment-timezone';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  agentStatusColorByAgentStatus,
  agentStatusDescriptionByAgentStatus,
  agentStatusLabelByAgentStatus,
  TAgentStatus,
} from '../../../common/services/wz_agent_status';
import { ColumnWithStatusIcon } from './column-with-status-icon';
import { EuiIconTip, EuiSpacer } from '@elastic/eui';
import {
  AGENT_STATUS_CODE,
  API_NAME_AGENT_STATUS,
} from '../../../common/constants';
import '../../styles/common.scss';
import { Agent } from '../endpoints-summary/types';
import { formatUIDate } from '../../react-services/time-service';
import './agent-status.scss';

interface AgentStatusProps {
  status: TAgentStatus;
  children?: string | null;
  style?: React.CSSProperties;
  agent?: Agent;
  /** Show the last keep alive of the agent in the tooltip of the status */
  showLastKeepAlive?: boolean;
}

export const AgentStatus = ({
  status,
  children,
  style = {},
  agent,
  showLastKeepAlive = false,
}: AgentStatusProps) => {
  const statusCodeAgent = AGENT_STATUS_CODE.find(
    status => status.STATUS_CODE === agent?.status_code,
  );
  const label = agentStatusLabelByAgentStatus(status);
  const description = agentStatusDescriptionByAgentStatus(status);
  // The manager reports no keep alive for agents that never connected
  const lastKeepAlive =
    showLastKeepAlive &&
    status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
    agent?.lastKeepAlive
      ? agent.lastKeepAlive
      : undefined;
  return (
    <div
      className='euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow'
      style={style}
    >
      <ColumnWithStatusIcon
        text={children || label.toLowerCase()}
        color={agentStatusColorByAgentStatus(status)}
        tooltip={
          showLastKeepAlive ? (
            <>
              <p>
                <FormattedMessage
                  id='wazuh.endpointsSummary.agentStatus.connectionStatus'
                  defaultMessage='Connection status: {status}'
                  values={{ status: <strong>{label.toLowerCase()}</strong> }}
                />
              </p>
              {lastKeepAlive && (
                <>
                  <EuiSpacer size='xs' />
                  <p>
                    <FormattedMessage
                      id='wazuh.endpointsSummary.agentStatus.lastKeepAlive'
                      defaultMessage='Last keep alive: {relativeTime}'
                      values={{
                        relativeTime: (
                          <strong>{moment(lastKeepAlive).fromNow()}</strong>
                        ),
                      }}
                    />
                  </p>
                  <p className='wz-agent-status-tooltip-date'>
                    {formatUIDate(lastKeepAlive)}
                  </p>
                </>
              )}
            </>
          ) : (
            label.toLowerCase()
          )
        }
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
            {/* Skipped when the status tooltip already shows the last keep alive */}
            {status === API_NAME_AGENT_STATUS.DISCONNECTED &&
              !lastKeepAlive &&
              agent?.lastKeepAlive && (
                <p>
                  {i18n.translate(
                    'wazuh.endpointsSummary.agentStatus.lastSeen',
                    {
                      defaultMessage: 'Last seen: {relativeTime}',
                      values: {
                        relativeTime: moment(agent.lastKeepAlive).fromNow(),
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
