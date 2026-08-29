import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import { AgentStatus } from '../../interfaces/types';
import {
  formatValueSafely,
  DistributionBar,
  DistributionBarSegment,
} from '../common';
import {
  API_NAME_AGENT_STATUS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../../../../common/constants';
import { WzButtonPermissions } from '../../../../permissions/button';
import { HOME_OVERVIEW_AGENT_STATUS_COLOR } from '../../lib/theme-colors';
import { agentStatusLabel, homeOverviewI18n } from '../../i18n';
import { FormattedMessage } from '@osd/i18n/react';

type AgentStatusName =
  (typeof API_NAME_AGENT_STATUS)[keyof typeof API_NAME_AGENT_STATUS];

const COUNT_BY_STATUS: Record<AgentStatusName, keyof AgentStatus> = {
  [API_NAME_AGENT_STATUS.ACTIVE]: 'active',
  [API_NAME_AGENT_STATUS.DISCONNECTED]: 'disconnected',
  [API_NAME_AGENT_STATUS.PENDING]: 'pending',
  [API_NAME_AGENT_STATUS.NEVER_CONNECTED]: 'neverConnected',
};

export interface AgentsByStatusProps {
  data: AgentStatus;
  /** Deploy-agent CTA href; passed in so this stays a pure presentational widget. */
  deployAgentUrl: string;
  onStatusSelect?: (status: string) => void;
}

/** Shows a deploy prompt when the fleet is empty. */
export const AgentsByStatus: React.FC<AgentsByStatusProps> = ({
  data,
  deployAgentUrl,
  onStatusSelect,
}) => {
  if (data.total === 0) {
    return (
      <EuiEmptyPrompt
        body={
          <p>
            {homeOverviewI18n.noAgentsBody}
            <br />
            {homeOverviewI18n.noAgentsHint}
          </p>
        }
        actions={
          <WzButtonPermissions
            color='primary'
            fill
            permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
            iconType='plusInCircle'
            href={deployAgentUrl}
            data-test-subj='agents-by-status-deploy'
          >
            {homeOverviewI18n.deployNewAgent}
          </WzButtonPermissions>
        }
      />
    );
  }

  const segments: DistributionBarSegment[] = UI_ORDER_AGENT_STATUS.map(
    status => ({
      key: status,
      label: agentStatusLabel(status),
      count: data[COUNT_BY_STATUS[status]] ?? 0,
      color: HOME_OVERVIEW_AGENT_STATUS_COLOR[status],
      onClick: onStatusSelect ? () => onStatusSelect(status) : undefined,
    }),
  );

  return (
    <DistributionBar
      segments={segments}
      headline={
        <EuiText size='s'>
          <FormattedMessage
            id='wazuh.homeOverview.agentsByStatus.activeHeadline'
            defaultMessage='{active} of {total} agents active'
            values={{
              active: (
                <strong className='tab-num'>
                  {formatValueSafely(data.active)}
                </strong>
              ),
              total: (
                <strong className='tab-num'>
                  {formatValueSafely(data.total)}
                </strong>
              ),
            }}
          />
        </EuiText>
      }
      data-test-subj='agents-by-status'
    />
  );
};
