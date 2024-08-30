/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  CoreSetup,
  CoreStart,
  ILegacyClusterClient,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/server';
import opensearchReportsPlugin from './backend/opensearch-reports-plugin';
import { NotificationsPlugin } from './clusters/notificationsPlugin';
import { buildConfig, ReportingConfigType } from './config';
import { ReportingConfig } from './config/config';
import registerRoutes from './routes';
import {
  ReportsDashboardsPluginSetup,
  ReportsDashboardsPluginStart,
} from './types';

export interface ReportsPluginRequestContext {
  logger: Logger;
  opensearchClient: ILegacyClusterClient;
}
//@ts-ignore
declare module 'kibana/server' {
  interface RequestHandlerContext {
    reports_plugin: ReportsPluginRequestContext;
  }
}

export class ReportsDashboardsPlugin
  implements
    Plugin<ReportsDashboardsPluginSetup, ReportsDashboardsPluginStart> {
  private readonly logger: Logger;
  private readonly initializerContext: PluginInitializerContext<
    ReportingConfigType
  >;
  private reportingConfig?: ReportingConfig;

  constructor(context: PluginInitializerContext<ReportingConfigType>) {
    this.logger = context.logger.get();
    this.initializerContext = context;
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('reports-dashboards: Setup');

    core.uiSettings.register({
      'reporting:useOcr': {
        name: 'Reporting use OCR on PDF',
        value: false,
        description:
          'Whether to run optical character recognition on PDF reports to make text selectable',
        schema: schema.boolean(),
      },
      'reporting:useFOR': {
        name: 'Reporting use ForeignObject rendering',
        value: true,
        description:
          'Whether to use ForeignObject rendering when generating reports. If it causes issues, try disabling this option.',
        schema: schema.boolean(),
      },
    });

    try {
      const config = await buildConfig(
        this.initializerContext,
        core,
        this.logger
      );
      this.reportingConfig = config;
      this.logger.debug('Setup complete');
    } catch (error) {
      this.logger.error(
        `Error in Reporting setup, reporting may not function properly`
      );
      this.logger.error(error);
    }

    if (!this.reportingConfig) {
      throw new Error('Reporting Config is not initialized');
    }

    const router = core.http.createRouter();
    // Deprecated API. Switch to the new opensearch client as soon as https://github.com/elastic/kibana/issues/35508 done.
    const opensearchReportsClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_reports',
      {
        plugins: [opensearchReportsPlugin, NotificationsPlugin],
      }
    );

    const notificationsClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_notifications',
      {
        plugins: [NotificationsPlugin],
      }
    );

    // Register server side APIs
    registerRoutes(router, this.reportingConfig);

    // put logger into route handler context, so that we don't need to pass through parameters
    core.http.registerRouteHandlerContext(
      //@ts-ignore
      'reporting_plugin',
      (context, request) => {
        return {
          logger: this.logger,
          opensearchReportsClient,
          notificationsClient,
        };
      }
    );

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('reports-dashboards: Started');
    return {};
  }

  public stop() {}
}
