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
  UI_COLOR_AGENT_STATUS,
  UI_LABEL_NAME_AGENT_STATUS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../../../../common/constants';
import { WzButtonPermissions } from '../../../../permissions/button';

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
            This instance has no agents registered.
            <br />
            Please deploy agents to begin monitoring your endpoints.
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
            Deploy new agent
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
      color: UI_COLOR_AGENT_STATUS[status],
      onClick: onStatusSelect ? () => onStatusSelect(status) : undefined,
    }),
  );

  return (
    <DistributionBar
      segments={segments}
      headline={
        <EuiText size='s'>
          <strong className='tab-num'>{formatValueSafely(data.active)}</strong>{' '}
          of{' '}
          <strong className='tab-num'>{formatValueSafely(data.total)}</strong>{' '}
          agents active
        </EuiText>
      }
      data-test-subj='agents-by-status'
    />
  );
};
