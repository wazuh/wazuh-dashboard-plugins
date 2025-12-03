import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { getCtiToken } from '../../services/cti-registration';
import { routes } from '../../../common/constants';

export const getCtiTokenRoute = (router: IRouter) => {
  router.post(
    {
      path: routes.token,
      validate: {
        body: schema.object({
          currentApiId: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { currentApiId } = request.body;

        const wazuhCore = context.wazuh_core;

        const nodeInfo = await wazuhCore.serverAPIClient.asInternalUser.request(
          'GET',
          `/cluster/imposter/info`,
          {},
          { apiHostID: currentApiId },
        );

        const uuid = nodeInfo?.data?.data?.affected_items?.[0]?.uuid

        const tokenResponse = await getCtiToken(uuid);

        return response.ok({
          body: tokenResponse,
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error(`Error requesting CTI token`);

        return response.customError({
          statusCode: error.statusCode || 503,
          body: finalError,
        });
      }
    },
  );
};
