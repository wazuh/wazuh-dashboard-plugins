/*
 * Wazuh app - Module for Wazuh-Elastic routes
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhElasticCtrl } from '../controllers';
import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';
import {
  WAZUH_SAMPLE_METRICS_AGENTS,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
  WAZUH_SAMPLE_INVENTORY_AGENT,
  WAZUH_SAMPLE_METRICS_COMMS,
  WAZUH_SAMPLE_VULNERABILITIES,
  WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
} from '../../common/constants';

export function WazuhElasticRoutes(router: IRouter) {
  const ctrl = new WazuhElasticCtrl();
  const schemaSampleAlertsCategories = schema.oneOf(
    [
      WAZUH_SAMPLE_METRICS_AGENTS,
      WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
      WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
      WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
      WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
      WAZUH_SAMPLE_INVENTORY_AGENT,
      WAZUH_SAMPLE_METRICS_COMMS,
      WAZUH_SAMPLE_VULNERABILITIES,
      WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
    ].map(category => schema.literal(category)),
  );

  // Endpoints
  router.get(
    {
      path: '/elastic/security/current-platform',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.getCurrentPlatform(context, request, response),
  );

  router.get(
    {
      path: '/indexer/findings/case/{index}/{documentId}',
      validate: {
        params: schema.object({
          index: schema.string(),
          documentId: schema.string(),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.getFindingsCase(context, request, response),
  );

  router.post(
    {
      path: '/indexer/findings/case/{index}/{documentId}',
      validate: {
        params: schema.object({
          index: schema.string(),
          documentId: schema.string(),
        }),
        body: schema.object({
          status: schema.maybe(
            schema.oneOf([
              schema.literal('active'),
              schema.literal('acknowledged'),
              schema.literal('completed'),
              schema.literal('error'),
              schema.literal('deleted'),
              schema.literal('audit'),
            ]),
          ),
          title: schema.maybe(schema.string({ maxLength: 1024 })),
          description: schema.maybe(schema.string()),
          tags: schema.maybe(schema.arrayOf(schema.string())),
          severity: schema.maybe(
            schema.oneOf([
              schema.literal('informational'),
              schema.literal('low'),
              schema.literal('medium'),
              schema.literal('high'),
              schema.literal('critical'),
              schema.literal(''),
            ]),
          ),
          priority: schema.maybe(
            schema.oneOf([
              schema.literal('urgent'),
              schema.literal('high'),
              schema.literal('medium'),
              schema.literal('low'),
              schema.literal(''),
            ]),
          ),
          tlp: schema.maybe(
            schema.oneOf([
              schema.literal('TLP:RED'),
              schema.literal('TLP:AMBER'),
              schema.literal('TLP:GREEN'),
              schema.literal('TLP:CLEAR'),
              schema.literal(''),
            ]),
          ),
          newComment: schema.maybe(schema.string({ minLength: 1 })),
          editedComments: schema.maybe(
            schema.arrayOf(
              schema.object({
                created_at: schema.string(),
                comment: schema.string({ minLength: 1 }),
              }),
              { maxSize: 20 },
            ),
          ),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.updateFindingsCase(context, request, response),
  );

  router.delete(
    {
      path: '/indexer/findings/case/{index}/{documentId}',
      validate: {
        params: schema.object({
          index: schema.string(),
          documentId: schema.string(),
        }),
      },
    },
    (context, request, response) =>
      ctrl.cleanFindingsCase(context, request, response),
  );

  // TODO: this seems that is unused and could be removed
  router.get(
    {
      path: '/elastic/template/{pattern}',
      validate: {
        params: schema.object({
          pattern: schema.string(),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.getTemplate(context, request, response),
  );

  // TODO: this seems to be deprecated in 4.9 so it could be removed
  router.get(
    {
      path: '/elastic/top/{mode}/{cluster}/{field}/{pattern}',
      validate: {
        params: schema.object({
          mode: schema.string(),
          cluster: schema.string(),
          field: schema.string(),
          pattern: schema.string(),
        }),
        query: schema.object({
          agentsList: schema.string(),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.getFieldTop(context, request, response),
  );

  // router.get(
  //   {
  //     path: '/indexer/sampledata/{category}',
  //     validate: {
  //       params: schema.object({
  //         category: schemaSampleAlertsCategories,
  //       }),
  //     },
  //   },
  //   async (context, request, response) =>
  //     ctrl.haveSampleDataOfCategory(context, request, response),
  // );

  // router.post(
  //   {
  //     path: '/indexer/sampledata/{category}',
  //     validate: {
  //       params: schema.object({
  //         category: schemaSampleAlertsCategories,
  //       }),
  //       body: schema.any(),
  //     },
  //   },
  //   async (context, request, response) =>
  //     ctrl.createSampleData(context, request, response),
  // );

  // router.delete(
  //   {
  //     path: '/indexer/sampledata/{category}',
  //     validate: {
  //       params: schema.object({
  //         category: schemaSampleAlertsCategories,
  //       }),
  //     },
  //   },
  //   async (context, request, response) =>
  //     ctrl.deleteSampleData(context, request, response),
  // );

  router.get(
    {
      path: '/indexer/settings',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.getIndexerSettings(context, request, response),
  );

  router.put(
    {
      path: '/indexer/settings',
      validate: {
        body: schema.object({
          engine: schema.recordOf(schema.string(), schema.any()),
        }),
      },
    },
    async (context, request, response) =>
      ctrl.updateIndexerSettings(context, request, response),
  );
}
