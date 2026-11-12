import { useEffect, useState } from 'react';
import type { CtiRegistrationPermissionAction } from '../../../../common/cti-registration-permission-api';
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

const DENIED: Omit<CtiRegistrationPermissionState, 'loading'> = {
  accessAllowed: false,
  missingPrivileges: [],
};

/**
 * Whether the current user may start CTI registration (`register`, the default) or clear
 * the local registration (`clear`).
 *
 * The probe runs when `enabled` becomes true and is skipped otherwise, so an already
 * registered environment never pays for the `register` probe. The modal mounts when it
 * opens, which is what makes the check run again on every open.
 *
 * Until the probe answers, `register` reads as allowed and `clear` as denied, matching
 * how each fails.
 */
export const useCtiRegistrationPermission = (
  enabled: boolean,
  action: CtiRegistrationPermissionAction = 'register',
): CtiRegistrationPermissionState => {
  const fallback = action === 'clear' ? DENIED : ALLOWED;
  const [state, setState] = useState<CtiRegistrationPermissionState>(() => ({
    loading: enabled,
    ...fallback,
  }));

  useEffect(() => {
    const initial = action === 'clear' ? DENIED : ALLOWED;
    if (!enabled) {
      setState({ loading: false, ...initial });
      return undefined;
    }

    let cancelled = false;
    setState({ loading: true, ...initial });

    (async () => {
      const permission = await fetchCtiRegistrationPermission(action);
      if (cancelled) {
        return;
      }
      setState({ loading: false, ...permission });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, action]);

  return state;
};
