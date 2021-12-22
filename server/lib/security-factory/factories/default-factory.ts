import { ISecurityFactory } from '../';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';

export class DefaultFactory implements ISecurityFactory{
  platform: string = '';
  async getCurrentUser(request: OpenSearchDashboardsRequest, context?:RequestHandlerContext) {
    return {
      username: 'elastic',
      authContext: {username: 'elastic',}
    };
  }
}
