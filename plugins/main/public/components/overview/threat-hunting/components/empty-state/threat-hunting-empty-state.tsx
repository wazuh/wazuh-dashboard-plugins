import React from 'react';
import { EuiButton, EuiCallOut, EuiPanel, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { withAgent } from '../../../../common/hocs/with-agent';
import { DiscoverNoResults } from '../../../../common/no-results/no-results';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';

export interface ThreatHuntingEmptyPromptProps {
  /** Pinned agent, an empty object when no agent is pinned. */
  agent?: { id?: string; name?: string };
  /** Unpins the agent so the module searches all agents. */
  onUnpinAgent: () => void;
}

/**
 * Replaces the generic no results callout when a pinned agent filters every result out. It names
 * the agent and offers to unpin it. Without a pinned agent it keeps the generic callout.
 */
export const ThreatHuntingEmptyPrompt = ({
  agent,
  onUnpinAgent,
}: ThreatHuntingEmptyPromptProps) => {
  if (!agent?.id) {
    return <DiscoverNoResults />;
  }

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color='transparent'>
      <EuiCallOut
        title={
          agent.name
            ? i18n.translate('wazuh.threatHunting.emptyState.titleForAgent', {
                defaultMessage:
                  'No results for the agent {agentName} ({agentId}) in the current search and time range',
                values: { agentName: agent.name, agentId: agent.id },
              })
            : i18n.translate('wazuh.threatHunting.emptyState.titleForAgentId', {
                defaultMessage:
                  'No results for the agent {agentId} in the current search and time range',
                values: { agentId: agent.id },
              })
        }
        color='warning'
        iconType='help'
        data-test-subj='wzThreatHuntingEmptyState'
      >
        <EuiText size='s'>
          <p>
            {i18n.translate(
              'wazuh.threatHunting.emptyState.pinnedAgentFilters',
              {
                defaultMessage:
                  'The pinned agent filters these results. Unpin it to search all agents.',
              },
            )}
          </p>
        </EuiText>
        <EuiButton
          size='s'
          onClick={onUnpinAgent}
          data-test-subj='wzThreatHuntingEmptyStateUnpin'
        >
          {i18n.translate('wazuh.threatHunting.emptyState.unpinAgent', {
            defaultMessage: 'Unpin agent',
          })}
        </EuiButton>
      </EuiCallOut>
    </EuiPanel>
  );
};

const unPinAgent = () => new PinnedAgentManager().unPinAgent();

/** The callout for the pinned agent, if any, unpinning it like the header button. */
export const ThreatHuntingEmptyState = withAgent(
  (props: Omit<ThreatHuntingEmptyPromptProps, 'onUnpinAgent'>) => (
    <ThreatHuntingEmptyPrompt {...props} onUnpinAgent={unPinAgent} />
  ),
);
