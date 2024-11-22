/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
  SharedGlobalConfig,
} from 'opensearch_dashboards/server';

import { WazuhPluginSetup, WazuhPluginStart, PluginSetup } from './types';
import { setupRoutes } from './routes';
import {
  jobInitializeRun,
  jobMonitoringRun,
  jobSchedulerRun,
  jobQueueRun,
  jobMigrationTasksRun,
  jobSanitizeUploadedFilesTasksRun,
} from './start';
import { first } from 'rxjs/operators';
import {
  initializationTaskCreatorIndexPattern,
  initializationTaskCreatorSetting,
  initializationTaskCreatorExistTemplate,
} from './lib/initialization';
import {
  PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
  PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
  PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
  WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
  WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
  WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER,
} from '../common/constants';
import { KnownFields } from '../public/utils/known-fields';
import { FieldsStatistics } from '../public/utils/statistics-fields';
import { FieldsMonitoring } from '../public/utils/monitoring-fields';
import VulnerabilitiesStatesFields from '../public/utils/vulnerabibility-states-fields.json';

declare module 'opensearch_dashboards/server' {
  interface RequestHandlerContext {
    wazuh: {
      logger: Logger;
      plugins: PluginSetup;
      security: any;
      api: {
        client: {
          asInternalUser: {
            authenticate: (apiHostID: string) => Promise<string>;
            request: (
              method: string,
              path: string,
              data: any,
              options: { apiHostID: string; forceRefresh?: boolean },
            ) => Promise<any>;
          };
          asCurrentUser: {
            authenticate: (apiHostID: string) => Promise<string>;
            request: (
              method: string,
              path: string,
              data: any,
              options: { apiHostID: string; forceRefresh?: boolean },
            ) => Promise<any>;
          };
        };
      };
    };
  }
}

export class WazuhPlugin implements Plugin<WazuhPluginSetup, WazuhPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('Wazuh-wui: Setup');

    const serverInfo = core.http.getServerInfo();

    core.http.registerRouteHandlerContext('wazuh', (context, request) => {
      return {
        // Create a custom logger with a tag composed of HTTP method and path endpoint
        logger: this.logger.get(
          `${request.route.method.toUpperCase()} ${request.route.path}`,
        ),
        server: {
          info: serverInfo,
        },
        plugins,
        security: plugins.wazuhCore.dashboardSecurity,
        api: context.wazuh_core.api,
      };
    });

    // Add custom headers to the responses
    core.http.registerOnPreResponse((request, response, toolkit) => {
      const additionalHeaders = {
        'x-frame-options': 'sameorigin',
      };
      return toolkit.next({ headers: additionalHeaders });
    });

    // Routes
    const router = core.http.createRouter();
    setupRoutes(router, plugins.wazuhCore);

    // Register initialization
    // Index pattern: alerts
    // TODO: this task should be registered by the related plugin
    plugins.wazuhCore.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: ctx => ctx.configuration.get('pattern'),
        taskName: 'index-pattern:alerts',
        options: {
          savedObjectOverwrite: {
            timeFieldName: 'timestamp',
          },
          fieldsNoIndices: KnownFields,
        },
        configurationSettingKey: 'checks.pattern',
      }),
    );
    // Index pattern: monitoring
    // TODO: this task should be registered by the related plugin
    plugins.wazuhCore.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: ctx =>
          ctx.configuration.get('wazuh.monitoring.pattern'),
        taskName: 'index-pattern:monitoring',
        options: {
          savedObjectOverwrite: {
            timeFieldName: 'timestamp',
          },
          fieldsNoIndices: FieldsMonitoring,
        },
        configurationSettingKey: 'checks.monitoring', // TODO: create new setting
      }),
    );
    // Index pattern: vulnerabilities
    // TODO: this task should be registered by the related plugin
    plugins.wazuhCore.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: ctx =>
          ctx.configuration.get('vulnerabilities.pattern'),
        taskName: 'index-pattern:vulnerabilities-states',
        options: {
          fieldsNoIndices: VulnerabilitiesStatesFields,
        },
        configurationSettingKey: 'checks.vulnerability', // TODO: create new setting
      }),
    );

    // Index pattern: statistics
    // TODO: this task should be registered by the related plugin
    plugins.wazuhCore.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: async ctx => {
          const appConfig = await ctx.configuration.get(
            'cron.prefix',
            'cron.statistics.index.name',
          );

          const prefixTemplateName = appConfig['cron.prefix'];
          const statisticsIndicesTemplateName =
            appConfig['cron.statistics.index.name'];
          return `${prefixTemplateName}-${statisticsIndicesTemplateName}-*`;
        },
        taskName: 'index-pattern:statistics',
        options: {
          savedObjectOverwrite: {
            timeFieldName: 'timestamp',
          },
          fieldsNoIndices: FieldsStatistics,
        },
        configurationSettingKey: 'checks.statistics', // TODO: create new setting
      }),
    );

    // Settings
    // TODO: this task should be registered by the related plugin
    [
      {
        key: PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
        value: WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
        configurationSetting: 'checks.maxBuckets',
      },
      {
        key: PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
        value: WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
        configurationSetting: 'checks.metaFields',
      },
      {
        key: PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
        value: JSON.stringify(WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER),
        configurationSetting: 'checks.timeFilter',
      },
    ].forEach(setting => {
      plugins.wazuhCore.initialization.register(
        initializationTaskCreatorSetting(setting, `setting:${setting.key}`),
      );
    });

    // Index pattern templates
    // Index pattern template: alerts
    // TODO: this task should be registered by the related plugin
    plugins.wazuhCore.initialization.register(
      initializationTaskCreatorExistTemplate({
        getOpenSearchClient: ctx => ctx.core.opensearch.client.asInternalUser,
        getIndexPatternTitle: ctx => ctx.configuration.get('pattern'),
        taskName: 'index-pattern-template:alerts',
      }),
    );

    return {};
  }

  public async start(core: CoreStart, plugins: any) {
    const globalConfiguration: SharedGlobalConfig =
      await this.initializerContext.config.legacy.globalConfig$
        .pipe(first())
        .toPromise();

    const contextServer = {
      config: globalConfiguration,
    };

    // Initialize
    jobInitializeRun({
      core,
      wazuh: {
        logger: this.logger.get('initialize'),
        api: plugins.wazuhCore.api,
      },
      wazuh_core: plugins.wazuhCore,
      server: contextServer,
    });

    // Sanitize uploaded files tasks
    jobSanitizeUploadedFilesTasksRun({
      core,
      wazuh: {
        logger: this.logger.get('sanitize-uploaded-files-task'),
        api: plugins.wazuhCore.api,
      },
      wazuh_core: plugins.wazuhCore,
      server: contextServer,
    });

    // Migration tasks
    jobMigrationTasksRun({
      core,
      wazuh: {
        logger: this.logger.get('migration-task'),
        api: plugins.wazuhCore.api,
      },
      wazuh_core: plugins.wazuhCore,
      server: contextServer,
    });

    // Monitoring
    jobMonitoringRun({
      core,
      wazuh: {
        logger: this.logger.get('monitoring'),
        api: plugins.wazuhCore.api,
      },
      wazuh_core: plugins.wazuhCore,
      server: contextServer,
    });

    // Scheduler
    jobSchedulerRun({
      core,
      wazuh: {
        logger: this.logger.get('cron-scheduler'),
        api: plugins.wazuhCore.api,
      },
      wazuh_core: plugins.wazuhCore,
      server: contextServer,
    });

    // Queue
    jobQueueRun({
      core,
      wazuh: {
        logger: this.logger.get('queue'),
        api: plugins.wazuhCore.api,
      },
      wazuh_core: plugins.wazuhCore,
      server: contextServer,
    });
    return {};
  }

  public stop() {}
}
