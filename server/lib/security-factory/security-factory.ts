import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { PluginSetup } from '../../types';

type CurrentUser = {
  username?: string;
  authContext: { [key: string]: any };
};

export interface ISecurityFactory {
  platform?: string;
  getCurrentUser(request: KibanaRequest, context?: RequestHandlerContext): Promise<CurrentUser>;
}

export async function SecurityObj(
  { security, opendistroSecurityKibana }: PluginSetup,
  context?: RequestHandlerContext
): Promise<ISecurityFactory> {
  const params = {
    path: `/_security/user`,
    method: 'GET',
  };

  try {
    const responseCurl = await context.core.elasticsearch.client.asInternalUser.transport.request(
      params
    );
  } catch (error) {
    return !!opendistroSecurityKibana
      ? new OpendistroFactory(opendistroSecurityKibana)
      : new DefaultFactory();
  }
  return new XpackFactory(security);
}
