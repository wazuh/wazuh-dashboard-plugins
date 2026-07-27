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
  UI_COLOR_STATUS,
} from '../../../../../../../common/constants';
import { WzButtonPermissions } from '../../../../permissions/button';

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

  const segments: DistributionBarSegment[] = [
    {
      key: API_NAME_AGENT_STATUS.ACTIVE,
      label: 'Active',
      count: data.active ?? 0,
      color: UI_COLOR_STATUS.success,
      onClick: onStatusSelect
        ? () => onStatusSelect(API_NAME_AGENT_STATUS.ACTIVE)
        : undefined,
    },
    {
      key: API_NAME_AGENT_STATUS.DISCONNECTED,
      label: 'Disconnected',
      count: data.disconnected ?? 0,
      color: UI_COLOR_STATUS.danger,
      onClick: onStatusSelect
        ? () => onStatusSelect(API_NAME_AGENT_STATUS.DISCONNECTED)
        : undefined,
    },
    {
      key: API_NAME_AGENT_STATUS.PENDING,
      label: 'Pending',
      count: data.pending ?? 0,
      color: UI_COLOR_STATUS.warning,
      onClick: onStatusSelect
        ? () => onStatusSelect(API_NAME_AGENT_STATUS.PENDING)
        : undefined,
    },
    {
      key: API_NAME_AGENT_STATUS.NEVER_CONNECTED,
      label: 'Never connected',
      count: data.neverConnected ?? 0,
      color: UI_COLOR_STATUS.disabled,
      onClick: onStatusSelect
        ? () => onStatusSelect(API_NAME_AGENT_STATUS.NEVER_CONNECTED)
        : undefined,
    },
  ];

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
