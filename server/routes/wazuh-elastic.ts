/*
 * Wazuh app - Module for Wazuh-Elastic routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhElasticCtrl } from '../controllers';
import { IRouter, RequestHandlerContext } from 'kibana/server';
import { schema } from '@kbn/config-schema';

export function WazuhElasticRouter(router: IRouter) {
  const ctrl = new WazuhElasticCtrl();

  router.get(
    {
      path: '/elastic/security/current-platform',
      validate: false,
    },
    async (context, request, response) => ctrl.getCurrentPlatform(context, request, response)
  );

  router.get(
    {
      path: '/elastic/index-patterns',
      validate: false,
    },
    async (context, request, response) => ctrl.getlist(context, request, response)
  );

  router.get(
    {
      path: '/elastic/known-fields/{pattern}',
      validate: {
        params: schema.object({
          pattern: schema.string(),
        })
      }
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/visualizations/{tab}/{pattern}',
      validate: {
        params: schema.object({
          tab: schema.string(),
          pattern: schema.string(),
        }),
      }
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/template/{pattern}',
      validate: {
        params: schema.object({
          pattern: schema.string(),
        })
      }
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/index-patterns/{pattern}',
      validate: {
        params: schema.object({
          pattern: schema.string(),
        })
      }
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/top/{mode}/{cluster}/{field}/{pattern}',
      validate: {
        params: schema.object({
          mode: schema.string(),
          cluster: schema.string(),
          field: schema.string(),
          pattern: schema.string(),
        })
      }
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.post(
    {
      path: '/elastic/alerts',
      validate: false,
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/samplealerts',
      validate: false,
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/samplealerts/{category}',
      validate: {
        params: schema.object({
          category: schema.string(),
        })
      },
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.post(
    {
      path: '/elastic/samplealerts/{category}',
      validate: {
        params: schema.object({
          category: schema.string(),
        })
      },
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.delete(
    {
      path: '/elastic/samplealerts/{category}',
      validate: {
        params: schema.object({
          category: schema.string(),
        })
      },
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.post(
    {
      path: '/elastic/esAlerts',
      validate: {
        query: schema.object({}),
      }
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );

  router.get(
    {
      path: '/elastic/statistics',
      validate: false
    },
    async (context, request, response) => response.ok({ body: 'Hi!' })
  );
}
