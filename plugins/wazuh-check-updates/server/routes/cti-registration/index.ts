import { IRouter } from 'opensearch-dashboards/server';
import { subscriptionToIndexerRoute } from './subscriptions';

export function apiInfoRoutes(router: IRouter) {
  subscriptionToIndexerRoute(router);
}
