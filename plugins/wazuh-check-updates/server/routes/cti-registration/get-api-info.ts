import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import { getApiInfo } from '../../services/cti-registration/get-api-info';

export const getApiInfoRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.apiInfo,
      validate: {},
    },
    async (context, request, response) => {
      try {
        const apiInfo = await getApiInfo(request);
        return response.ok({
          body: apiInfo,
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
