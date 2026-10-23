import { IRouter } from 'opensearch-dashboards/server';
import { contentManagerRoutes, routes } from '../../../common/constants';

interface ContentManagerError {
  statusCode?: number;
  message?: string;
  meta?: { statusCode?: number; body?: { message?: string } };
}

/**
 * Requests an on-demand sync of the CTI content. The indexer evaluates the
 * request as the current user, so its own privileges gate the action.
 */
export const getCtiFeedContentUpdateRoute = (router: IRouter) => {
  router.post(
    {
      path: routes.ctiFeedContentUpdate,
      validate: false,
    },
    async (context, _request, response) => {
      try {
        const result =
          await context.core.opensearch.client.asCurrentUser.transport.request({
            method: 'POST',
            path: contentManagerRoutes.contentUpdate,
          });

        return response.ok({
          body: {
            message: 'CTI content update requested',
            ...((result.body as Record<string, unknown>) ?? {}),
          },
        });
      } catch (error) {
        const { statusCode, message, meta } = error as ContentManagerError;
        const reason = meta?.body?.message || message || String(error);

        return response.customError({
          statusCode: meta?.statusCode ?? statusCode ?? 500,
          body: {
            message: `Could not update the CTI content: ${reason}`,
          },
        });
      }
    },
  );
};
