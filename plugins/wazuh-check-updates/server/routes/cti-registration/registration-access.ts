import type {
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import { evaluateCtiRegistrationPermission } from '../../services/cti-registration';

/** `unknown`: the indexer could not answer the permission probe. */
export type CtiRegistrationAccess = 'allowed' | 'denied' | 'unknown';

/**
 * Whether the current user holds the indexer privilege that registering needs. The
 * routes that read or change the pending registration require it.
 */
export async function getCtiRegistrationAccess(
  context: RequestHandlerContext,
): Promise<CtiRegistrationAccess> {
  const permission = await evaluateCtiRegistrationPermission(
    context.core.opensearch.client,
  );
  if (!permission) {
    return 'unknown';
  }
  return permission.accessAllowed ? 'allowed' : 'denied';
}

/** Fails closed: 403 when denied, 503 when the probe could not be evaluated. */
export function ctiRegistrationAccessError(
  response: OpenSearchDashboardsResponseFactory,
  access: Exclude<CtiRegistrationAccess, 'allowed'>,
) {
  if (access === 'denied') {
    return response.forbidden({
      body: {
        message:
          'The current user lacks the privilege required to register this environment.',
      },
    });
  }
  return response.customError({
    statusCode: 503,
    body: {
      message:
        'The privilege required to register this environment could not be checked.',
    },
  });
}
