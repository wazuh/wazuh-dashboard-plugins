import {
  CoreSetup,
  ILegacyClusterClient,
} from '../../../../../src/core/server';
import { NotificationsPlugin } from './plugin/notification-plugin';

// Reference: https://github.com/opensearch-project/dashboards-notifications/blob/d24660dbec78de4000777884d04e5159501c2b61/server/plugin.ts#L22C43-L70C1
export function notificationSetup(core: CoreSetup) {
  const notificationsClient: ILegacyClusterClient =
    core.opensearch.legacy.createClient('opensearch_notifications', {
      plugins: [NotificationsPlugin],
    });

  return notificationsClient;
}
