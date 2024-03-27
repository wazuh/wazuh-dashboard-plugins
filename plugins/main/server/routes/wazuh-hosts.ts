/*
 * Wazuh app - Module for Wazuh-API routes
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhHostsCtrl } from '../controllers';
import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';

export function WazuhHostsRoutes(router: IRouter, services) {
  const ctrl = new WazuhHostsCtrl();

  // Get Wazuh-API entries list (Multimanager) from elasticsearch index
  router.get(
    {
      path: '/hosts/apis',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.getHostsEntries(context, request, response),
  );

  // Create the API host entry
  router.post(
    {
      path: '/hosts/apis/{id}',
      validate: {
        params: schema.object({
          id:
            services.configuration._settings
              .get('hosts')
              ?.options?.arrayOf?.id?.validateBackend?.(schema) ??
            schema.string(),
        }),
        body: (value, response) => {
          const settingHosts = services.configuration._settings.get('hosts');

          try {
            const validation = schema
              .object(
                Object.fromEntries(
                  Object.entries(settingHosts.options.arrayOf).map(
                    ([key, value]) => [
                      key,
                      value.validateBackend
                        ? value.validateBackend(schema)
                        : schema.any(),
                    ],
                  ),
                ),
              )
              .validate(value);
            return response.ok(validation);
          } catch (error) {
            return response.badRequest(error.message);
          }
        },
      },
    },
    async (context, request, response) =>
      ctrl.createAPIHost(context, request, response),
  );

  // Update the API host entry
  router.put(
    {
      path: '/hosts/apis/{id}',
      validate: {
        params: schema.object({
          id:
            services.configuration._settings
              .get('hosts')
              ?.options?.arrayOf?.id?.validateBackend?.(schema) ??
            schema.string(),
        }),
        body: (value, response) => {
          const settingHosts = services.configuration._settings.get('hosts');

          try {
            const validation = schema
              .object(
                Object.fromEntries(
                  Object.entries(settingHosts.options.arrayOf).map(
                    ([key, value]) => [
                      key,
                      schema.maybe(
                        value.validateBackend
                          ? value.validateBackend(schema)
                          : schema.any(),
                      ),
                    ],
                  ),
                ),
              )
              .validate(value);
            return response.ok(validation);
          } catch (error) {
            return response.badRequest(error.message);
          }
        },
      },
    },
    async (context, request, response) =>
      ctrl.updateAPIHost(context, request, response),
  );

  // Delete the API host entry
  router.delete(
    {
      path: '/hosts/apis/{id}',
      validate: {
        params: schema.object({
          id:
            services.configuration._settings
              .get('hosts')
              ?.options?.arrayOf?.id?.validateBackend?.(schema) ??
            schema.string(),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.deleteAPIHost(context, request, response),
  );
}
