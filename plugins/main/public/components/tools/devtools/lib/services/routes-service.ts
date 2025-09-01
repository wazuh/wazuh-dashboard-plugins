import { GenericRequest } from '../../../../../react-services';
import type { ApiRoutes } from './api-routes.types';

export interface RoutesService {
  getAvailableRoutes(): Promise<ApiRoutes>;
}

export class ApiRoutesService implements RoutesService {
  async getAvailableRoutes(): Promise<ApiRoutes> {
    const response = await GenericRequest.request<any>(
      'GET',
      '/api/routes',
      {},
    );
    return !response.error ? (response.data as ApiRoutes) : [];
  }
}
