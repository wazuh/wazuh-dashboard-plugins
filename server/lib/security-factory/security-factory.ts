import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { PluginSetup } from '../../types'

type CurrentUser = {
  username?: string 
  authContext: {[key:string]: any}
}

export interface ISecurityFactory {
  platform?: string
  getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext): Promise<CurrentUser> 
}

export function SecurityObj({security, opendistroSecurityKibana}:PluginSetup): ISecurityFactory {
  if (!!security) {
    return new XpackFactory(security);
  } else if (!!opendistroSecurityKibana) {
    return new OpendistroFactory(opendistroSecurityKibana);
  } else {
    return new DefaultFactory();
  }
}