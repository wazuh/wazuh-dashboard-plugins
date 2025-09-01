import { GenericRequest } from '../../../../../react-services';

export interface RoutesService {
  getAvailableRoutes(): Promise<any[]>;
}

export class ApiRoutesService implements RoutesService {
  async getAvailableRoutes(): Promise<any[]> {
    const response = await GenericRequest.request('GET', '/api/routes', {});
    return !response.error ? response.data : [];
  }
}
