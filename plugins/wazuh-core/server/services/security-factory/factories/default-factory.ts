import { ISecurityFactory } from '..';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { ELASTIC_NAME } from '../../../../common/constants';
import md5 from 'md5';

export class DefaultFactory implements ISecurityFactory {
  platform: string = '';
  async getCurrentUser(
    request: OpenSearchDashboardsRequest,
    context?: RequestHandlerContext,
  ) {
    return {
      username: ELASTIC_NAME,
      authContext: { username: ELASTIC_NAME },
      hashUsername: md5(ELASTIC_NAME),
    };
  }
  async isAdministratorUser(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ) {
    // This is replaced after creating the instance
  }
}
