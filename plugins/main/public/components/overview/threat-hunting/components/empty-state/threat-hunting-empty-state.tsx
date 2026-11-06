import React from 'react';
import { i18n } from '@osd/i18n';
import { withAgent } from '../../../../common/hocs/with-agent';
import { DiscoverNoResults } from '../../../../common/no-results/no-results';
import {
  ModuleEmptyState,
  unpinPinnedAgent,
} from '../../../../common/no-results/module-empty-state';

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
    <ModuleEmptyState
      testSubj='ThreatHunting'
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
      onUnpinAgent={onUnpinAgent}
    >
      <p>
        {i18n.translate('wazuh.threatHunting.emptyState.pinnedAgentFilters', {
          defaultMessage:
            'The pinned agent filters these results. Unpin it to search all agents.',
        })}
      </p>
    </ModuleEmptyState>
  );
};

/** The callout for the pinned agent, if any, unpinning it like the header button. */
export const ThreatHuntingEmptyState = withAgent(
  (props: Omit<ThreatHuntingEmptyPromptProps, 'onUnpinAgent'>) => (
    <ThreatHuntingEmptyPrompt {...props} onUnpinAgent={unpinPinnedAgent} />
  ),
);
