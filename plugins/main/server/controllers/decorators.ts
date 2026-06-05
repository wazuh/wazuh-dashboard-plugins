import { ErrorResponse } from '../lib/error-response';

export function routeDecoratorProtectedAdministrator(errorCode: number) {
  return handler => {
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
