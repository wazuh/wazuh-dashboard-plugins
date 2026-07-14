import { IRouter } from 'opensearch_dashboards/server';
import { HTTP_STATUS_CODES } from '../../../common/constants';
import type {
  CtiConsumer,
  CtiConsumersResponse,
} from '../../../common/cti-consumers';
import { ErrorResponse } from '../../lib/error-response';

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

export const CtiConsumersRoutes = (router: IRouter) => {
  router.get(
    {
      path: '/api/cti-consumers',
      validate: false,
    },
    async (context, _request, response) => {
      try {
        const result =
          await context.core.opensearch.client.asInternalUser.search({
            index: CTI_CONSUMERS_INDEX,
            body: { query: { match_all: {} }, size: 1000 },
          });

        const hits = result.body?.hits?.hits ?? [];
        const data = hits.map((hit: { _source: Record<string, unknown> }) =>
          mapHitToConsumer(hit._source ?? {}),
        );

        return response.ok<CtiConsumersResponse>({ body: { data } });
      } catch (error) {
        const statusCode =
          (error as { statusCode?: number })?.statusCode ??
          HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

        // Index not created yet is a normal, expected empty state, not an error.
        if (statusCode === HTTP_STATUS_CODES.NOT_FOUND) {
          return response.ok<CtiConsumersResponse>({ body: { data: [] } });
        }

        return ErrorResponse(
          `Could not fetch CTI consumers: ${
            (error as Error)?.message || error
          }`,
          4006,
          HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
          response,
        );
      }
    },
  );
};
