import { ISecurityFactory } from '../';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';

export class DefaultFactory implements ISecurityFactory{
  async getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext) {
    return { username: 'elastic'};
  }
}