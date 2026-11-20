import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ctiFlowState } from '../../../services/cti-flow-state';

/**
 * What a subscription change is made of: registered or not, and the plan. `null` while
 * the subscription is unknown (not read yet, or the Wazuh Console could not answer), which
 * is never a change.
 */
export function getSubscriptionKey(): string | null {
  const message = ctiFlowState.getSubscription()?.message;
  if (!message) {
    return null;
  }
  return `${message.is_registered}|${message.plan?.name ?? ''}`;
}

/**
 * Calls `onChange` when a registration status read (on load, on its polling, or when
 * the tab becomes visible again) finds the registration or the plan changed since the
 * previous known read. The server starts a content update on that change, so the page
 * reads the feed sync state again.
 */
export const useSubscriptionChange = (onChange: () => void): void => {
  // Re-renders when the registration or the plan changes, wherever it was read.
  useSyncExternalStore(ctiFlowState.subscribe, ctiFlowState.getVersion);
  const key = getSubscriptionKey();
  const previousKey = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (key === null) {
      return;
    }
    if (previousKey.current !== null && previousKey.current !== key) {
      onChangeRef.current();
    }
    previousKey.current = key;
  }, [key]);
};
