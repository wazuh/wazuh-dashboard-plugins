import {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import { ErrorResponse } from '../lib/error-response';

export function routeDecoratorProtectedAdministrator(errorCode: number) {
  return (
    handler: (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => Promise<unknown>,
  ) => {
    return async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      try {
        const { administrator, administrator_requirements } =
          await context.wazuh_core.dashboardSecurity.isAdministratorUser(
            context,
            request,
          );
        if (!administrator) {
          return ErrorResponse(administrator_requirements, 403, 403, response);
        }
        return await handler(context, request, response);
      } catch (error) {
        return ErrorResponse(error.message || error, errorCode, 500, response);
      }
    };
  };
}

export function routeDecoratorConfigurationAPIEditable(errorCode: number) {
  return (
    handler: (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => Promise<unknown>,
  ) => {
    return async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      try {
        const canEditConfiguration = await context.wazuh_core.configuration.get(
          'configuration.ui_api_editable',
        );

        if (!canEditConfiguration) {
          return response.forbidden({
            body: {
              message:
                'The ability to edit the configuration from API is disabled. This can be enabled using configuration.ui_api_editable setting from the configuration file. Contact with an administrator.',
            },
          });
        }
        return await handler(context, request, response);
      } catch (error) {
        return ErrorResponse(error.message || error, errorCode, 500, response);
      }
    };
  };
}

export function compose(...functions: Function[]) {
  if (functions.length === 1) {
    return functions[0];
  }
  return functions.reduce(
    (acc, fn) =>
      (...args: any) =>
        acc(fn(...args)),
  );
}
