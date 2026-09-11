import { IScopedClusterClient } from 'opensearch-dashboards/server';
import {
  CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM,
  contentManagerRoutes,
} from '../../../common/constants';
import type { CtiRegistrationPermissionApiBody } from '../../../common/cti-registration-permission-api';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

/**
 * Answer used whenever the probe cannot be evaluated (older indexer without the
 * parameter, transport failure, unreadable body). The indexer still enforces the
 * privilege when registration is applied, so failing open only means the user sees
 * the same error they saw before this check existed — failing closed would hide the
 * action from users who are allowed to register.
 */
const PERMISSION_NOT_EVALUATED: CtiRegistrationPermissionApiBody = {
  accessAllowed: true,
  missingPrivileges: [],
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
 * register a CTI subscription, without starting anything: the probe reads no body and
 * has no side effects.
 *
 * Never rejects — an unusable answer resolves to {@link PERMISSION_NOT_EVALUATED}.
 */
export async function checkCtiRegistrationPermission(
  wazuhClient: IScopedClusterClient,
): Promise<CtiRegistrationPermissionApiBody> {
  try {
    const response = await wazuhClient.asCurrentUser.transport.request({
      method: 'POST',
      path: contentManagerRoutes.subscription,
      querystring: { [CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM]: 'true' },
    });

    const body = response.body as {
      accessAllowed?: unknown;
      missingPrivileges?: unknown;
    } | null;

    if (typeof body?.accessAllowed !== 'boolean') {
      logWarning(
        'CTI registration permission check answered without an accessAllowed flag; treating the current user as allowed to register.',
      );
      return PERMISSION_NOT_EVALUATED;
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
      `CTI registration permission check could not be evaluated (${message}); treating the current user as allowed to register.`,
    );
    return PERMISSION_NOT_EVALUATED;
  }
}
