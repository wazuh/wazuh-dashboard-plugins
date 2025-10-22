import { OPENSEARCH_API } from '../common/constants';

export function NotificationsPlugin(Client: any, config: any, components: any) {
  const clientAction = components.clientAction.factory;

  Client.prototype.notifications = components.clientAction.namespaceFactory();
  const notifications = Client.prototype.notifications.prototype;

  notifications.getConfigs = clientAction({
    url: {
      fmt: OPENSEARCH_API.CONFIGS,
    },
    method: 'GET',
  });

  notifications.createConfig = clientAction({
    url: {
      fmt: OPENSEARCH_API.CONFIGS,
    },
    method: 'POST',
    needBody: true,
  });
}
