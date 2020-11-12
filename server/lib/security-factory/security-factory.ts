import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { WAZUH_SECURITY_PLUGIN_XPACK_SECURITY, WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH } from '../../../util/constants';
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { PluginSetup } from '../../types'


export interface ISecurityFactory {
  getCurrentUser(request: KibanaRequest, context?:RequestHandlerContext): Promise<any>
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