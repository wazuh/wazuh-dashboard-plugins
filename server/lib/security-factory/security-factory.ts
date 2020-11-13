import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { PluginSetup } from '../../types'

type CurrentUser = {
  userName?: string 
  authContext: {[key:string]: any}
}

export interface ISecurityFactory {
  platform?: string
  getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext): Promise<CurrentUser> 
}

export function SecurityObj({security, opendistroSecurity}:PluginSetup): ISecurityFactory {
  if (!!security) {
    return new XpackFactory(security);
  } else if (!!opendistroSecurity) {
    return new OpendistroFactory(opendistroSecurity);
  } else {
    return new DefaultFactory();
  }
}