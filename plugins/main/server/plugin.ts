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
import { ILegacyClusterClient } from '../../../src/core/server';

import { WazuhPluginSetup, WazuhPluginStart, PluginSetup } from './types';
import { setupRoutes } from './routes';
import {
  jobInitializeRun,
  jobQueueRun,
  jobMigrationTasksRun,
  jobSanitizeUploadedFilesTasksRun,
} from './start';
import { first } from 'rxjs/operators';
import {
  defineTimeFieldNameIfExist,
  initializationTaskCreatorIndexPattern,
  initializationTaskCreatorServerAPIConnectionCompatibility,
  mapFieldsFormat,
} from './health-check';
import {
  HEALTH_CHECK_TASK_INDEX_PATTERN_AGENTS_MONITORING,
  HEALTH_CHECK_TASK_INDEX_PATTERN_ALERTS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_FILES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_VALUES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_BROWSER_EXTENSIONS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_GROUPS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HARDWARE_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HOTFIXES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_INTERFACES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_NETWORKS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PACKAGES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PORTS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROCESSES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROTOCOLS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SERVICES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SYSTEM_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_USERS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_SERVER_STATISTICS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES,
  INDEX_PATTERN_ALERTS_REQUIRED_FIELDS,
  WAZUH_FIM_FILES_PATTERN,
  WAZUH_FIM_REGISTRY_KEYS_PATTERN,
  WAZUH_FIM_REGISTRY_VALUES_PATTERN,
  WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
  WAZUH_IT_HYGIENE_GROUPS_PATTERN,
  WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
  WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  WAZUH_IT_HYGIENE_PATTERN,
  WAZUH_IT_HYGIENE_PORTS_PATTERN,
  WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
  WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
  WAZUH_IT_HYGIENE_SERVICES_PATTERN,
  WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
  WAZUH_IT_HYGIENE_USERS_PATTERN,
  WAZUH_SCA_PATTERN,
  WAZUH_VULNERABILITIES_PATTERN,
} from '../common/constants';
import { notificationSetup } from './health-check/notification-default-channels';
import { initializeDefaultNotificationChannel } from './health-check/notification-default-channels/tasks';

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

  isNotificationsDashboardsAvailable(plugins: PluginSetup): boolean {
    return !!plugins.notificationsDashboards;
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

    // Register health check tasks

    const notificationClient: ILegacyClusterClient = notificationSetup(core);
    // Detect Notifications plugin availability to conditionally register tasks
    if (this.isNotificationsDashboardsAvailable(plugins)) {
      core.healthCheck.register(
        initializeDefaultNotificationChannel(notificationClient),
      );
    } else {
      this.logger.debug(
        `Skipping default notification channels task. Notifications dashboards plugin not available.`,
      );
    }

    // server API connection-compatibility
    core.healthCheck.register(
      initializationTaskCreatorServerAPIConnectionCompatibility({
        taskName: 'server-api:connection-compatibility',
        services: plugins.wazuhCore,
      }),
    );

    // index patterns
    core.healthCheck.register(
      // TODO: this could check if there is compatible index pattern regarding the fields instead of a hardcoded title/ID
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_ALERTS,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist('timestamp'),
          hasTemplate: true,
          hasFields: INDEX_PATTERN_ALERTS_REQUIRED_FIELDS,
          hasTimeFieldName: true,
        },
        configurationSettingKey: 'pattern',
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_AGENTS_MONITORING,
        indexPatternID: 'wazuh-monitoring-*',
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist('timestamp'),
          hasTimeFieldName: true,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_SERVER_STATISTICS,
        indexPatternID: 'wazuh-statistics-*',
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist('timestamp'),
          hasTimeFieldName: true,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES,
        indexPatternID: WAZUH_VULNERABILITIES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'destination.port': 'integer',
            'host.memory.free': 'bytes',
            'host.memory.total': 'bytes',
            'host.memory.used': 'bytes',
            'host.memory.usage': 'percent',
            'host.network.egress.bytes': 'bytes',
            'host.network.ingress.bytes': 'bytes',
            'package.size': 'bytes',
            'process.parent.pid': 'integer',
            'process.pid': 'integer',
            'source.port': 'integer',
          }),
        },
        indexPatternID: WAZUH_IT_HYGIENE_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_GROUPS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_GROUPS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HARDWARE_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HOTFIXES_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_INTERFACES_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'host.network.egress.bytes': 'bytes',
            'host.network.ingress.bytes': 'bytes',
          }),
        },
        indexPatternID: WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_NETWORKS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PACKAGES_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'package.size': 'bytes',
          }),
        },
        indexPatternID: WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PORTS_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'destination.port': 'integer',
            'process.pid': 'integer',
            'source.port': 'integer',
          }),
        },
        indexPatternID: WAZUH_IT_HYGIENE_PORTS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROCESSES_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'process.parent.pid': 'integer',
            'process.pid': 'integer',
          }),
        },
        indexPatternID: WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROTOCOLS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SYSTEM_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_USERS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_USERS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SERVICES_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_SERVICES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName:
          HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_BROWSER_EXTENSIONS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_FILES_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'file.size': 'bytes',
          }),
        },
        indexPatternID: WAZUH_FIM_FILES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES,
        indexPatternID: WAZUH_FIM_REGISTRY_KEYS_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_VALUES_STATES,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'registry.size': 'bytes',
          }),
        },
        indexPatternID: WAZUH_FIM_REGISTRY_VALUES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES,
        indexPatternID: WAZUH_SCA_PATTERN,
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

  public stop() { }
}
