import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { AgentStatus } from '../../interfaces/types';
import {
  formatValueSafely,
  DistributionBar,
  DistributionBarSegment,
} from '../common';
import {
  API_NAME_AGENT_STATUS,
  UI_LABEL_NAME_AGENT_STATUS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../../../../common/constants';
import { WzButtonPermissions } from '../../../../permissions/button';
import { HOME_OVERVIEW_AGENT_STATUS_COLOR } from '../../lib/theme-colors';

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
            {i18n.translate(
              'wazuh.common.homeOverviewAgentsByStatus.noAgents',
              { defaultMessage: 'This instance has no agents registered.' },
            )}
            <br />
            {i18n.translate(
              'wazuh.common.homeOverviewAgentsByStatus.deployAgentsHint',
              {
                defaultMessage:
                  'Please deploy agents to begin monitoring your endpoints.',
              },
            )}
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
            {i18n.translate(
              'wazuh.common.homeOverviewAgentsByStatus.deployAgentButton',
              { defaultMessage: 'Deploy new agent' },
            )}
          </WzButtonPermissions>
        }
      />
    );
  }

  const segments: DistributionBarSegment[] = UI_ORDER_AGENT_STATUS.map(
    status => ({
      key: status,
      label: UI_LABEL_NAME_AGENT_STATUS[status],
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
            id='wazuh.common.homeOverviewAgentsByStatus.activeHeadline'
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
