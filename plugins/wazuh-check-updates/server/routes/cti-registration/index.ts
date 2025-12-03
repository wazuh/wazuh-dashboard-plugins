import { IRouter } from 'opensearch-dashboards/server';
import {
  getStatusSubscriptionIndexerRoute,
  subscriptionToIndexerRoute,
} from './subscriptions';
import { getCtiTokenRoute } from './token';

export function apiInfoRoutes(router: IRouter) {
  subscriptionToIndexerRoute(router);
  getStatusSubscriptionIndexerRoute(router);
  getCtiTokenRoute(router);
}
