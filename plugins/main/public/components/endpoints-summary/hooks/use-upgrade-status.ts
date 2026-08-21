import { useEffect, useRef } from 'react';
import {
  AGENT_UPGRADE_STATUS_POLL_INTERVAL_MS,
  AGENT_UPGRADE_STATUS_POLL_TIMEOUT_MS,
} from '../../../../common/constants';
import { getAgentVersion } from '../../../../common/services/wz-agent';
import { getToasts } from '../../../kibana-services';
import { getAgentsService } from '../services';
import { upgradeStatusState } from '../services/upgrade-status-state';

const normalizeVersion = (version: string): string => {
  try {
    return getAgentVersion(version).raw;
  } catch {
    return version;
  }
};

export const useUpgradeStatus = (
  reloadAgents: () => void,
  reloadTrigger: unknown,
) => {
  const reloadAgentsRef = useRef(reloadAgents);
  reloadAgentsRef.current = reloadAgents;

  useEffect(() => {
    if (!upgradeStatusState.hasPending()) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkStatus = async () => {
      const pending = upgradeStatusState.getPendingAgents();
      if (!pending.length) {
        return;
      }

      const now = Date.now();
      const timedOutIds = pending
        .filter(
          agent =>
            now - agent.trackedAtMs > AGENT_UPGRADE_STATUS_POLL_TIMEOUT_MS,
        )
        .map(agent => agent.id);
      if (timedOutIds.length) {
        upgradeStatusState.removeAgents(timedOutIds);
      }

      const stillPending = upgradeStatusState.getPendingAgents();
      if (!stillPending.length) {
        return;
      }

      try {
        const { affected_items: agents } = await getAgentsService({
          agents: stillPending.map(agent => agent.id),
        });
        if (cancelled) {
          return;
        }

        const upgradedIds = agents
          .filter(agent => {
            const before = stillPending.find(p => p.id === agent.id)?.version;
            return (
              before !== undefined &&
              typeof agent.version === 'string' &&
              normalizeVersion(agent.version) !== normalizeVersion(before)
            );
          })
          .map(agent => agent.id);

        if (upgradedIds.length) {
          upgradeStatusState.removeAgents(upgradedIds);
          getToasts().add({
            color: 'success',
            title: 'Upgrade agent',
            text:
              upgradedIds.length === 1
                ? `Agent ${upgradedIds[0]} was upgraded successfully`
                : `${upgradedIds.length} agents were upgraded successfully`,
            toastLifeTimeMs: 5000,
          });
          reloadAgentsRef.current();
        }
      } catch {
        // Transient errors don't clear tracking; the next tick retries.
      }
    };

    const schedule = () => {
      timeoutId = setTimeout(async () => {
        if (cancelled) {
          return;
        }
        await checkStatus();
        if (!cancelled && upgradeStatusState.hasPending()) {
          schedule();
        }
      }, AGENT_UPGRADE_STATUS_POLL_INTERVAL_MS);
    };

    void checkStatus().then(() => {
      if (!cancelled && upgradeStatusState.hasPending()) {
        schedule();
      }
    });

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [reloadTrigger]);
};
