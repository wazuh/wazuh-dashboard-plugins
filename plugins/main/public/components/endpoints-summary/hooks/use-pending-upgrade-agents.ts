import { useEffect, useState } from 'react';
import { upgradeStatusState } from '../services/upgrade-status-state';

/** Re-renders whenever upgradeStatusState's tracked agents change, without waiting for a poll tick. */
export const usePendingUpgradeAgents = () => {
  const [pendingAgents, setPendingAgents] = useState(() =>
    upgradeStatusState.getPendingAgents(),
  );

  useEffect(() => {
    setPendingAgents(upgradeStatusState.getPendingAgents());
    return upgradeStatusState.subscribe(() => {
      setPendingAgents(upgradeStatusState.getPendingAgents());
    });
  }, []);

  return pendingAgents;
};
