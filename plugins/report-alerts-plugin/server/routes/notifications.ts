/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { REPORTING_NOTIFICATIONS_DASHBOARDS_API } from '../../common';
import {
  IRouter,
  IOpenSearchDashboardsResponse,
  ResponseError,
  Logger,
  ILegacyScopedClusterClient,
} from '../../../../src/core/server';
import { joinRequestParams } from './utils/helpers';

export default function (router: IRouter) {
  // Get all configs from Notifications
  router.get(
    {
      path: REPORTING_NOTIFICATIONS_DASHBOARDS_API.GET_CONFIGS,
      validate: {
        query: schema.object({
          from_index: schema.number(),
          max_items: schema.number(),
          query: schema.maybe(schema.string()),
          config_type: schema.oneOf([
            schema.arrayOf(schema.string()),
            schema.string(),
          ]),
          feature_list: schema.maybe(
            schema.oneOf([schema.arrayOf(schema.string()), schema.string()])
          ),
          is_enabled: schema.maybe(schema.boolean()),
          sort_field: schema.string(),
          sort_order: schema.string(),
          config_id_list: schema.maybe(
            schema.oneOf([schema.arrayOf(schema.string()), schema.string()])
          ),
        }),
      },
    },
    async (context, request, response) => {
      const config_type = joinRequestParams(request.query.config_type);
      const feature_list = joinRequestParams(request.query.feature_list);
      const config_id_list = joinRequestParams(request.query.config_id_list);
      const query = request.query.query;
      // @ts-ignore
      const client: ILegacyScopedClusterClient =
        context.report_alerts_plugin.notificationsClient.asScoped(request);
      try {
        const resp = await client.callAsCurrentUser(
          'notifications.getConfigs',
          {
            from_index: request.query.from_index,
            max_items: request.query.max_items,
            is_enabled: request.query.is_enabled,
            sort_field: request.query.sort_field,
            sort_order: request.query.sort_order,
            config_type,
            ...(feature_list && { feature_list }),
            ...(query && { query }),
            ...(config_id_list && { config_id_list }),
          }
        );
        return response.ok({ body: resp });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // get event by id
  router.get(
    {
      path: `${REPORTING_NOTIFICATIONS_DASHBOARDS_API.GET_EVENT}/{eventId}`,
      validate: {
        params: schema.object({
          eventId: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      // @ts-ignore
      const client: ILegacyScopedClusterClient =
        context.report_alerts_plugin.notificationsClient.asScoped(request);
      try {
        const resp = await client.callAsCurrentUser(
          'notifications.getEventById',
          { eventId: request.params.eventId }
        );
        return response.ok({ body: resp });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // Send test message
  router.get(
    {
      path: `${REPORTING_NOTIFICATIONS_DASHBOARDS_API.SEND_TEST_MESSAGE}/{configId}`,
      validate: {
        params: schema.object({
          configId: schema.string(),
        }),
        query: schema.object({
          feature: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      // @ts-ignore
      const client: ILegacyScopedClusterClient =
        context.report_alerts_plugin.notificationsClient.asScoped(request);
      try {
        const resp = await client.callAsCurrentUser(
          'notifications.sendTestMessage',
          {
            configId: request.params.configId,
            feature: request.query.feature,
          }
        );
        return response.ok({ body: resp });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
