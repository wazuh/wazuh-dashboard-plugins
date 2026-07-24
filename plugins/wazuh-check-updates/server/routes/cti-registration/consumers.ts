import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type {
  CtiConsumer,
  CtiConsumersResponse,
} from '../../../common/cti-consumers';

const CTI_CONSUMERS_INDEX = '.wazuh-cti-consumers';

function mapHitToConsumer(source: Record<string, unknown>): CtiConsumer {
  return {
    name: (source.name as string) ?? '',
    context: (source.context as string) ?? '',
    type: (source.type as string) ?? '',
    resource: (source.resource as string) ?? '',
    is_public: Boolean(source.is_public),
    status: (source.status as string) ?? '',
    local_offset: Number(source.local_offset) || 0,
    remote_offset: Number(source.remote_offset) || 0,
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

        const hits = result.body?.hits?.hits ?? [];
        const data = hits.map((hit: { _source: Record<string, unknown> }) =>
          mapHitToConsumer(hit._source ?? {}),
        );

        return response.ok<CtiConsumersResponse>({ body: { data } });
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
