/*
 * Wazuh app - Module for Wazuh reporting routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhReportingCtrl } from '../controllers';
import { IRouter } from 'kibana/server';
import { schema } from '@kbn/config-schema';

export function WazuhReportingRoutes(router: IRouter) {
  const ctrl = new WazuhReportingCtrl();

  // Builds a PDF report from multiple PNG images
  router.post({
      path: '/reports',
      validate: {
        body: schema.object({
          array: schema.any(),
          browserTimezone: schema.string(),
          filters: schema.any(),
          isAgents: schema.maybe(schema.string()),
          components: schema.maybe(schema.any()),
          name: schema.string(),
          searchBar: schema.string(),
          section: schema.maybe(schema.string()),
          tab: schema.string(),
          tables: schema.any(),
          time: schema.oneOf([schema.object({
            from: schema.string(),
            to: schema.string()
          }), schema.string()]),
          title: schema.maybe(schema.string())
        })
      }
    },
    (context, request, response) => ctrl.report(context, request, response)
  );

  router.post({
      path: '/reports/modules/{moduleID}',
      validate: {
        body: schema.object({
          array: schema.any(),
          browserTimezone: schema.string(),
          filters: schema.maybe(schema.any()),
          agents: schema.maybe(schema.oneOf([schema.string(), schema.boolean()])),
          components: schema.maybe(schema.any()),
          name: schema.string(),
          searchBar: schema.maybe(schema.string()),
          section: schema.maybe(schema.string()),
          tab: schema.string(),
          tables: schema.maybe(schema.any()),
          time: schema.oneOf([schema.object({
            from: schema.string(),
            to: schema.string()
          }), schema.string()]),
          title: schema.maybe(schema.string())
        }),
        params: schema.object({
          moduleID: schema.string()
        })
      }
    },
    (context, request, response) => ctrl.createReportsModules(context, request, response)
  );

  router.post({
    path: '/reports/groups/{groupID}',
    validate: {
      body: schema.object({
        browserTimezone: schema.string(),
        filters: schema.maybe(schema.any()),
        components: schema.maybe(schema.any()),
        name: schema.string(),
        section: schema.maybe(schema.string()),
        tab: schema.string(),
      }),
      params: schema.object({
        groupID: schema.string()
      })
    }
  },
    (context, request, response) => ctrl.createReportsGroups(context, request, response)
  );

  router.post({
    path: '/reports/agents/{agentID}',
    validate: {
      body: schema.object({
        browserTimezone: schema.string(),
        filters: schema.any(),
        components: schema.maybe(schema.any()),
        name: schema.string(),
        section: schema.maybe(schema.string()),
        tab: schema.string(),
      }),
      params: schema.object({
        agentID: schema.string()
      })
    }
  },
    (context, request, response) => ctrl.createReportsAgents(context, request, response)
  );

  router.post({
    path: '/reports/agents/{agentID}/inventory',
    validate: {
      body: schema.object({
        array: schema.any(),
        browserTimezone: schema.string(),
        filters: schema.maybe(schema.any()),
        agents: schema.maybe(schema.oneOf([schema.string(), schema.boolean()])),
        components: schema.maybe(schema.any()),
        name: schema.string(),
        searchBar: schema.maybe(schema.oneOf([schema.string(), schema.boolean()])),
        section: schema.maybe(schema.string()),
        tab: schema.string(),
        tables: schema.maybe(schema.any()),
        time: schema.oneOf([schema.object({
          from: schema.string(),
          to: schema.string()
        }), schema.string()]),
        title: schema.maybe(schema.string())
      }),
      params: schema.object({
        agentID: schema.string()
      })
    }
  },
    (context, request, response) => ctrl.createReportsAgentsInventory(context, request, response)
  );

  // Fetch specific report
  router.get({
      path: '/reports/{name}',
      validate: {
        params: schema.object({
          name: schema.string()
        })
      }
    },
    (context, request, response) => ctrl.getReportByName(context, request, response)
  );

  // Delete specific report
  router.delete({
      path: '/reports/{name}',
      validate: {
        params: schema.object({
          name: schema.string()
        })
      }
    },
    (context, request, response) => ctrl.deleteReportByName(context, request, response)
  )

  // Fetch the reports list
  router.get({
      path: '/reports',
      validate: false
    },
    (context, request, response) => ctrl.getReports(context, request, response)
  );
}
