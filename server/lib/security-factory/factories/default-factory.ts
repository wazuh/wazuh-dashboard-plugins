import { ISecurityFactory } from '../';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';

export class DefaultFactory implements ISecurityFactory{
  platform: string = '';
  async getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext) {
    return { 
      username: 'elastic',
      authContext: {username: 'elastic',}
    };
  }
}