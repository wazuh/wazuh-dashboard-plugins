import { ISecurityFactory } from '../';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import md5 from 'md5';

export class DefaultFactory implements ISecurityFactory{
  platform: string = '';
  async getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext) {
    return { 
      username: 'elastic',
      authContext: { username: 'elastic' },
      hashUsername: md5('elastic')
    };
  }
}