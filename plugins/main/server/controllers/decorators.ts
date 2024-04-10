import { ErrorResponse } from '../lib/error-response';

export function routeDecoratorProtectedAdministrator(
  routeHandler,
  errorCode: number,
) {
  return async (context, request, response) => {
    try {
      const { administrator, administrator_requirements } =
        await context.wazuh_core.dashboardSecurity.isAdministratorUser(
          context,
          request,
        );
      if (!administrator) {
        return ErrorResponse(administrator_requirements, 403, 403, response);
      }
      return await routeHandler(context, request, response);
    } catch (error) {
      return ErrorResponse(error.message || error, errorCode, 500, response);
    }
  };
}
