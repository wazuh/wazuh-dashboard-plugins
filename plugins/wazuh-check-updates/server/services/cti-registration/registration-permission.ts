import { IScopedClusterClient } from 'opensearch-dashboards/server';
import {
  CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM,
  contentManagerRoutes,
} from '../../../common/constants';
import type {
  CtiRegistrationPermissionAction,
  CtiRegistrationPermissionApiBody,
} from '../../../common/cti-registration-permission-api';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

/**
 * Answer used whenever the registration probe cannot be evaluated (older indexer without
 * the parameter, transport failure, unreadable body). The indexer still enforces the
 * privilege when registration is applied, so failing open only means the user sees
 * the same error they saw before this check existed — failing closed would hide the
 * action from users who are allowed to register.
 */
const PERMISSION_NOT_EVALUATED: CtiRegistrationPermissionApiBody = {
  accessAllowed: true,
  missingPrivileges: [],
};

/**
 * Clearing the local registration is only offered to users the indexer confirms, so an
 * unusable answer to that probe denies it.
 */
const CLEAR_PERMISSION_NOT_EVALUATED: CtiRegistrationPermissionApiBody = {
  accessAllowed: false,
  missingPrivileges: [],
};

/** HTTP method of the Content Manager subscription action each probe evaluates. */
const PROBE_METHOD: Record<CtiRegistrationPermissionAction, 'POST' | 'DELETE'> =
  {
    register: 'POST',
    clear: 'DELETE',
  };

/** The plugin services are unavailable in some contexts; never fail on the logger. */
function logWarning(message: string): void {
  try {
    getWazuhCheckUpdatesServices().logger.warn(message);
  } catch {
    // Logger itself unavailable; nothing more we can safely do here.
  }
}

function normalizeMissingPrivileges(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Asks Content Manager whether the current user holds the privilege required to
 * register a CTI subscription (`register`) or to remove it (`clear`), without running
 * the action: the security plugin answers the probe instead of executing it.
 *
 * Never rejects: resolves to `null` when the answer cannot be evaluated, so routes that
 * change the registration can deny instead of allowing.
 */
export async function evaluateCtiRegistrationPermission(
  wazuhClient: IScopedClusterClient,
  action: CtiRegistrationPermissionAction = 'register',
): Promise<CtiRegistrationPermissionApiBody | null> {
  try {
    const response = await wazuhClient.asCurrentUser.transport.request({
      method: PROBE_METHOD[action],
      path: contentManagerRoutes.subscription,
      querystring: { [CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM]: 'true' },
    });

    const body = response.body as {
      accessAllowed?: unknown;
      missingPrivileges?: unknown;
    } | null;

    if (typeof body?.accessAllowed !== 'boolean') {
      logWarning(
        `CTI registration permission check (${action}) answered without an accessAllowed flag.`,
      );
      return null;
    }

    return {
      accessAllowed: body.accessAllowed,
      missingPrivileges: normalizeMissingPrivileges(body.missingPrivileges),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'unknown error';

    logWarning(
      `CTI registration permission check (${action}) could not be evaluated (${message}).`,
    );
    return null;
  }
}

/**
 * Same probe for the browser. An unusable answer resolves to
 * {@link PERMISSION_NOT_EVALUATED} for `register` and to
 * {@link CLEAR_PERMISSION_NOT_EVALUATED} for `clear`.
 */
export async function checkCtiRegistrationPermission(
  wazuhClient: IScopedClusterClient,
  action: CtiRegistrationPermissionAction = 'register',
): Promise<CtiRegistrationPermissionApiBody> {
  return (
    (await evaluateCtiRegistrationPermission(wazuhClient, action)) ??
    (action === 'clear'
      ? CLEAR_PERMISSION_NOT_EVALUATED
      : PERMISSION_NOT_EVALUATED)
  );
}
