/*
 * Wazuh app - Module for Wazuh reporting routes
 * Copyright (C) 2015-2022 Wazuh, Inc.
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

  const agentIDValidation = schema.string({
    minLength: 3,
    validate: (agentID: string) => /^\d{3,}$/.test(agentID) ? undefined : 'must be 0-9 are allowed'
  });

  const groupIDValidation = schema.string({
    minLength: 1,
    validate: (agentID: string) => /^(?!^(\.{1,2}|all)$)[\w\.\-]+$/.test(agentID) ? undefined : 'must be A-z, 0-9, _, . are allowed. It must not be ., .. or all.'
  });

  const ReportFilenameValidation = schema.string({
    validate: (agentID: string) => /^[\w\-\.]+\.pdf$/.test(agentID) ? undefined : 'must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'
  });

  const moduleIDValidation = schema.oneOf([
    schema.literal('general'),
    schema.literal('fim'),
    schema.literal('aws'),
    schema.literal('gcp'),
    schema.literal('pm'),
    schema.literal('audit'),
    schema.literal('sca'),
    schema.literal('office'),
    schema.literal('github'),
    schema.literal('ciscat'),
    schema.literal('vuls'),
    schema.literal('mitre'),
    schema.literal('virustotal'),
    schema.literal('docker'),
    schema.literal('osquery'),
    schema.literal('oscap'),
    schema.literal('pci'),
    schema.literal('hipaa'),
    schema.literal('nist'),
    schema.literal('gdpr'),
    schema.literal('tsc'),
  ]);

  router.post({
      path: '/reports/modules/{moduleID}',
      validate: {
        body: schema.object({
          array: schema.any(),
          browserTimezone: schema.string(),
          serverSideQuery: schema.maybe(schema.any()),
          filters: schema.maybe(schema.any()),
          agents: schema.maybe(schema.oneOf([agentIDValidation, schema.boolean()])),
          components: schema.maybe(schema.any()),
          searchBar: schema.maybe(schema.string()),
          section: schema.maybe(schema.string()),
          tab: schema.string(),
          tables: schema.maybe(schema.any()),
          time: schema.oneOf([schema.object({
            from: schema.string(),
            to: schema.string()
          }), schema.string()]),
          indexPatternTitle: schema.string(),
          apiId: schema.string()
        }),
        params: schema.object({
          moduleID: moduleIDValidation
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
        section: schema.maybe(schema.string()),
        apiId: schema.string()
      }),
      params: schema.object({
        groupID: groupIDValidation
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
        section: schema.maybe(schema.string()),
        apiId: schema.string()
      }),
      params: schema.object({
        agentID: agentIDValidation
      })
    }
  },
    (context, request, response) => ctrl.createReportsAgentsConfiguration(context, request, response)
  );

  router.post({
    path: '/reports/agents/{agentID}/inventory',
    validate: {
      body: schema.object({
        array: schema.any(),
        browserTimezone: schema.string(),
        serverSideQuery: schema.maybe(schema.any()),
        filters: schema.maybe(schema.any()),
        agents: schema.maybe(schema.oneOf([schema.string(), schema.boolean()])),
        components: schema.maybe(schema.any()),
        searchBar: schema.maybe(schema.oneOf([schema.string(), schema.boolean()])),
        section: schema.maybe(schema.string()),
        tab: schema.string(),
        tables: schema.maybe(schema.any()),
        time: schema.oneOf([schema.object({
          from: schema.string(),
          to: schema.string()
        }), schema.string()]),
        indexPatternTitle: schema.string(),
        apiId: schema.string()
      }),
      params: schema.object({
        agentID: agentIDValidation
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
          name: ReportFilenameValidation
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
          name: ReportFilenameValidation
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
