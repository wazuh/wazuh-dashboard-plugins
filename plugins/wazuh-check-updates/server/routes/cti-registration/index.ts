import { IRouter } from 'opensearch-dashboards/server';
import {
  getStatusSubscriptionIndexerRoute,
  subscriptionToIndexerRoute,
} from './subscriptions';

export function apiInfoRoutes(router: IRouter) {
  subscriptionToIndexerRoute(router);
  getStatusSubscriptionIndexerRoute(router);
}
