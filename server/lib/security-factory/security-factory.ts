import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';

export interface ISecurityFactory {
  getCurrentUser(req): Promise<{ user }> 
}

export function SecurityObj(platform, server) {
  switch(platform){
    case 'xpack':
      return new XpackFactory(server);
    case 'opendistro':
      return new OpendistroFactory(server);
    default:
      return new DefaultFactory(server);
  }
}