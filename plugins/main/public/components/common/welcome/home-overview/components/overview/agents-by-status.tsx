import React from 'react';
import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import { AgentStatus } from '../../interfaces/types';
import { formatValueSafely } from '../common';
import {
  API_NAME_AGENT_STATUS,
  UI_COLOR_STATUS,
} from '../../../../../../../common/constants';
import { WzButtonPermissions } from '../../../../permissions/button';

export interface AgentsByStatusProps {
  data: AgentStatus;
  /** Deploy-agent CTA href; passed in so this stays a pure presentational widget. */
  deployAgentUrl: string;
  onStatusSelect?: string;
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

  return (
    <div style={{ textDecoration: 'none' }}>
      <RedirectAppLinks application={getCore().application}>
        <EuiFlexGroup alignItems='baseline' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size='l'>
              <EuiLink
                className='tab-num'
                style={{
                  color: UI_COLOR_STATUS.success,
                  fontWeight: 'inherit',
                }}
                onClick={() => onStatusSelect?.(API_NAME_AGENT_STATUS.ACTIVE)}
                data-test-subj='agents-active-count'
              >
                {formatValueSafely(data.active)}
              </EuiLink>
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
              <EuiLink
                color='subdued'
                onClick={() =>
                  onStatusSelect?.(API_NAME_AGENT_STATUS.DISCONNECTED)
                }
                data-test-subj='agents-disconnected-count'
              >
                <strong>{formatValueSafely(data.disconnected)}</strong>{' '}
                disconnected
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='xs' color='subdued'>
              <EuiLink
                color='subdued'
                onClick={() => onStatusSelect?.(API_NAME_AGENT_STATUS.PENDING)}
                data-test-subj='agents-pending-count'
              >
                <strong>{formatValueSafely(data.pending)}</strong> pending
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='xs' color='subdued'>
              <EuiLink
                color='subdued'
                onClick={() =>
                  onStatusSelect?.(API_NAME_AGENT_STATUS.NEVER_CONNECTED)
                }
                data-test-subj='agents-never-connected-count'
              >
                <strong>{formatValueSafely(data.neverConnected)}</strong> never
                connected
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </RedirectAppLinks>
    </div>
  );
};
