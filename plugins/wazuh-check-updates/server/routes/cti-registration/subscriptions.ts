import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import { subscriptionToIndexer } from '../../services/cti-registration/subscriptions';

export const subscriptionToIndexerRoute = (router: IRouter) => {
  router.post(
    {
      path: routes.subscription,
      validate: {},
    },
    async (context, request, response) => {
      try {
        const subscription = await subscriptionToIndexer(request);
        return response.ok({
          body: subscription,
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error(`Error trying to get available updates`);

        return response.customError({
          statusCode: 503,
          body: finalError,
        });
      }
    },
  );
};

export const getStatusSubscriptionIndexerRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.subscription,
      validate: {},
    },
    async (context, request, response) => {
      try {
        const subscriptionStatus = await subscriptionToIndexer(request);
        return response.ok({
          body: subscriptionStatus,
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error(`Error trying to get subscription status`);

        return response.customError({
          statusCode: 503,
          body: finalError,
        });
      }
    },
  );
};
