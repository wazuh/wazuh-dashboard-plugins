import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTitle, EuiText } from '@elastic/eui';
import { AgentStatus } from '../services/types';
import { formatUINumber } from '../../../../../react-services/format-number';
import { UI_COLOR_STATUS } from '../../../../../../common/constants';

export interface AgentsByStatusProps {
  data: AgentStatus;
}

/** Active-agent hero with the other statuses as a subdued secondary line. */
export const AgentsByStatus: React.FC<AgentsByStatusProps> = ({ data }) => (
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
