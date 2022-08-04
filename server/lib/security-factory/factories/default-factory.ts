import { ISecurityFactory } from '../';
import { ELASTIC_NAME } from '../../../../common/constants';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import md5 from 'md5';

export class DefaultFactory implements ISecurityFactory{
  platform: string = '';
  async getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext) {
    return { 
      username: ELASTIC_NAME,
      authContext: { username: ELASTIC_NAME },
      hashUsername: md5(ELASTIC_NAME)
    };
  }
}