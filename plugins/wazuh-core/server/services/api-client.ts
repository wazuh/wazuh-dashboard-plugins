import  * as ApiInterceptor from './api-interceptor';
import { APIInterceptorRequestOptionsInternalUser } from './api-interceptor';

export const wazuhApiClient = {
    client: {
      asInternalUser: {
        authenticate: async (apiHostID: string) =>
          await ApiInterceptor.authenticate(apiHostID),
        request: async (method: string, path: string, data: any, options: APIInterceptorRequestOptionsInternalUser) =>
          await ApiInterceptor.requestAsInternalUser(
            method,
            path,
            data,
            options,
          ),
      },
    },
  };