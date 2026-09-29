import { useEffect, useState } from 'react';
import { fetchCtiRegistrationPermission } from '../../../services/cti-registration-permission';

export interface CtiRegistrationPermissionState {
  /** True while the probe is in flight; nothing should be offered or denied yet. */
  loading: boolean;
  accessAllowed: boolean;
  missingPrivileges: string[];
}

const ALLOWED: Omit<CtiRegistrationPermissionState, 'loading'> = {
  accessAllowed: true,
  missingPrivileges: [],
};

/**
 * Whether the current user may start CTI registration.
 *
 * The probe runs when `enabled` becomes true and is skipped otherwise, so an already
 * registered environment never pays for it. The modal mounts when it opens, which is
 * what makes the check run again on every open.
 */
export const useCtiRegistrationPermission = (
  enabled: boolean,
): CtiRegistrationPermissionState => {
  const [state, setState] = useState<CtiRegistrationPermissionState>(() => ({
    loading: enabled,
    ...ALLOWED,
  }));

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, ...ALLOWED });
      return undefined;
    }

    let cancelled = false;
    setState({ loading: true, ...ALLOWED });

    (async () => {
      const permission = await fetchCtiRegistrationPermission();
      if (cancelled) {
        return;
      }
      setState({ loading: false, ...permission });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
};
