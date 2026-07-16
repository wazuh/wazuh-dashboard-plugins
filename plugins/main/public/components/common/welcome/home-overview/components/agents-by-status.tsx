import React from 'react';
import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiTitle, EuiText } from '@elastic/eui';
import { AgentStatus } from '../services/types';
import { formatUINumber } from '../../../../../react-services/format-number';
import { UI_COLOR_STATUS } from '../../../../../../common/constants';
import { WzButtonPermissions } from '../../../permissions/button';

export interface AgentsByStatusProps {
  data: AgentStatus;
  /** Href for the "deploy a new agent" CTA, shown instead of the counts when
   * the fleet is empty. Passed in (rather than imported) so this widget
   * stays a pure presentational component, like every other leaf widget. */
  deployAgentUrl: string;
}

/** Active-agent hero with the other statuses as a subdued secondary line.
 * Renders a "deploy an agent" prompt instead when the fleet is empty. */
export const AgentsByStatus: React.FC<AgentsByStatusProps> = ({
  data,
  deployAgentUrl,
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

  return (
    <div>
      <EuiFlexGroup alignItems='baseline' gutterSize='s' responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size='l'>
            <span
              className='tab-num'
              style={{ color: UI_COLOR_STATUS.success }}
              data-test-subj='agents-active-count'
            >
              {formatUINumber(data.active)}
            </span>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size='s' color='subdued'>
            agents active
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup
        gutterSize='l'
        responsive={false}
        wrap
        style={{ marginTop: 8 }}
      >
        <EuiFlexItem grow={false}>
          <EuiText size='xs' color='subdued'>
            <strong>{formatUINumber(data.disconnected)}</strong> disconnected
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size='xs' color='subdued'>
            <strong>{formatUINumber(data.pending)}</strong> pending
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size='xs' color='subdued'>
            <strong>{formatUINumber(data.neverConnected)}</strong> never connected
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
