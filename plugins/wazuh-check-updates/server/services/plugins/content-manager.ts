import { contentManagerRoutes } from '../../../common/constants';

export function initializeClientContentManager(
  Client: any,
  _config: any,
  components: any,
) {
  const clientAction = components.clientAction.factory;

  Client.prototype.contentManager = components.clientAction.namespaceFactory();
  const contentManager = Client.prototype.contentManager.prototype;

  contentManager.subscription = clientAction({
    url: {
      fmt: contentManagerRoutes.subscription,
    },
    method: 'GET',
  });

  contentManager.contentUpdate = clientAction({
    url: {
      fmt: contentManagerRoutes.contentUpdate,
    },
    method: 'POST',
    needBody: true,
  });
}
