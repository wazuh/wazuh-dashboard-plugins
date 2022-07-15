import { ISecurityFactory } from '../';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import md5 from 'md5';

export class DefaultFactory implements ISecurityFactory{
  platform: string = '';
  async getCurrentUser(request: OpenSearchDashboardsRequest, context?:RequestHandlerContext) {
    return {
      username: 'elastic',
      authContext: { username: 'elastic' },
      hashUsername: md5('elastic')
    };
  }
}
