/* eslint-disable camelcase -- consumer fields keep the index's snake_case names */
import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type {
  CtiConsumer,
  CtiConsumersResponse,
} from '../../../common/cti-consumers';

const CTI_CONSUMERS_INDEX = '.wazuh-cti-consumers';
/**
 * Id of the index's one non-consumer document, which holds `last_checked_at`
 * for the whole catalog instead of a feed.
 */
const CTI_GLOBAL_DOCUMENT_ID = 'cti:catalog:global';

interface ConsumerHit {
  _id?: string;
  _source?: Record<string, unknown>;
}

/** The value when it is a non-empty string, so it can be spread in or left out. */
function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/** The string entries of a list, or `undefined` when the value is not a list. */
function optionalStringList(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item)
    : undefined;
}

function mapHitToConsumer(source: Record<string, unknown>): CtiConsumer {
  const updatedAt = optionalString(source.updated_at);
  const pendingSyncPhases = optionalStringList(source.pending_sync_phases);
  return {
    name: (source.name as string) ?? '',
    context: (source.context as string) ?? '',
    type: (source.type as string) ?? '',
    resource: (source.resource as string) ?? '',
    is_public: Boolean(source.is_public),
    status: (source.status as string) ?? '',
    local_offset: Number(source.local_offset) || 0,
    remote_offset: Number(source.remote_offset) || 0,
    ...(updatedAt ? { updated_at: updatedAt } : {}),
    ...(pendingSyncPhases ? { pending_sync_phases: pendingSyncPhases } : {}),
  };
}

export const getCtiConsumersRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.ctiConsumers,
      validate: {},
    },
    async (context, _request, response) => {
      try {
        const result =
          await context.core.opensearch.client.asCurrentUser.search({
            index: CTI_CONSUMERS_INDEX,
            body: { query: { match_all: {} }, size: 1000 },
          });

        const hits: ConsumerHit[] = result.body?.hits?.hits ?? [];
        const globalHit = hits.find(hit => hit._id === CTI_GLOBAL_DOCUMENT_ID);
        const data = hits
          .filter(hit => hit !== globalHit)
          .map(hit => mapHitToConsumer(hit._source ?? {}));
        const lastCheckedAt = optionalString(
          globalHit?._source?.last_checked_at,
        );

        return response.ok<CtiConsumersResponse>({
          body: {
            data,
            ...(lastCheckedAt ? { last_checked_at: lastCheckedAt } : {}),
          },
        });
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;

        // Index not created yet is a normal, expected empty state, not an error.
        if (statusCode === 404) {
          return response.ok<CtiConsumersResponse>({ body: { data: [] } });
        }

        const message =
          error instanceof Error
            ? error.message
            : typeof (error as { message?: unknown })?.message === 'string'
            ? (error as { message: string }).message
            : 'Could not fetch CTI consumers';

        const finalError = new Error(
          `Could not fetch CTI consumers: ${message}`,
        );

        return response.customError({
          statusCode: statusCode ?? 503,
          body: finalError,
        });
      }
    },
  );
};
