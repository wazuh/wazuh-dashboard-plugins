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
import { jobInitializeRun, jobQueueRun } from './start';
import { first } from 'rxjs/operators';
import {
  defineTimeFieldNameIfExist,
  initializationTaskCreatorIndexPattern,
  initializationTaskCreatorServerAPIConnectionCompatibility,
  initializationTaskCreatorServerAPIRunAs,
  mapFieldsFormat,
} from './health-check';
import { initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations } from './health-check';
import {
  FIELD_TIMESTAMP,
  HEALTH_CHECK_TASK_INDEX_PATTERN_AGENTS_MONITORING,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_ACCESS_MANAGEMENT,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_APLICATIONS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES_AWS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES_AZURE,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES_GCP,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_NETWORK_ACTIVITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_OTHER,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SECURITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SYSTEM_ACTIVITY,
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
  WAZUH_EVENTS_PATTERN,
  WAZUH_EVENTS_ACCESS_MANAGEMENT_PATTERN,
  WAZUH_EVENTS_APLICATIONS_PATTERN,
  WAZUH_EVENTS_CLOUD_SERVICES_AWS_PATTERN,
  WAZUH_EVENTS_CLOUD_SERVICES_AZURE_PATTERN,
  WAZUH_EVENTS_CLOUD_SERVICES_GCP_PATTERN,
  WAZUH_EVENTS_CLOUD_SERVICES_PATTERN,
  WAZUH_EVENTS_NETWORK_ACTIVITY_PATTERN,
  WAZUH_EVENTS_OTHER_PATTERN,
  WAZUH_EVENTS_SECURITY_PATTERN,
  WAZUH_EVENTS_SYSTEM_ACTIVITY_PATTERN,
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
  WAZUH_MONITORING_PATTERN,
  WAZUH_SCA_PATTERN,
  WAZUH_STATISTICS_PATTERN,
  WAZUH_VULNERABILITIES_PATTERN,
} from '../common/constants';

import { notificationSetup } from './health-check/notification-default-channels';
import { initializeDefaultNotificationChannel } from './health-check/notification-default-channels/tasks';
import IndexPatternEventsKnownFields from '../common/known-fields/events.json';
import IndexPatternEventsAccessManagementKnownFields from '../common/known-fields/events-access-management.json';
import IndexPatternEventsApplicationsKnownFields from '../common/known-fields/events-applications.json';
import IndexPatternEventsCloudServicesKnownFields from '../common/known-fields/events-cloud-services.json';
import IndexPatternEventsCloudServicesAWSKnownFields from '../common/known-fields/events-cloud-services-aws.json';
import IndexPatternEventsCloudServicesAzureKnownFields from '../common/known-fields/events-cloud-services-azure.json';
import IndexPatternEventsCloudServicesGCPKnownFields from '../common/known-fields/events-cloud-services-gcp.json';
import IndexPatternEventsNetworkActivityKnownFields from '../common/known-fields/events-network-activity.json';
import IndexPatternEventsOtherKnownFields from '../common/known-fields/events-other.json';
import IndexPatternEventsSecurityKnownFields from '../common/known-fields/events-security.json';
import IndexPatternEventsSystemActivityKnownFields from '../common/known-fields/events-system-activity.json';
import IndexPatternFIMFilesKnownFields from '../common/known-fields/states-fim-files.json';
import IndexPatternFIMRegistriesKeysKnownFields from '../common/known-fields/states-fim-registries-keys.json';
import IndexPatternFIMRegistriesValuesKnownFields from '../common/known-fields/states-fim-registries-values.json';
import IndexPatternITHygieneBrowserExtensionsKnownFields from '../common/known-fields/states-inventory-browser-extensions.json';
import IndexPatternITHygieneGroupsKnownFields from '../common/known-fields/states-inventory-groups.json';
import IndexPatternITHygieneHardwareKnownFields from '../common/known-fields/states-inventory-hardware.json';
import IndexPatternITHygieneHotfixesKnownFields from '../common/known-fields/states-inventory-hotfixes.json';
import IndexPatternITHygieneInterfacesKnownFields from '../common/known-fields/states-inventory-interfaces.json';
import IndexPatternITHygieneInventoryKnownFields from '../common/known-fields/states-inventory.json';
import IndexPatternITHygieneNetworkKnownFields from '../common/known-fields/states-inventory-networks.json';
import IndexPatternITHygienePackagesKnownFields from '../common/known-fields/states-inventory-packages.json';
import IndexPatternITHygienePortsKnownFields from '../common/known-fields/states-inventory-ports.json';
import IndexPatternITHygieneProcessesKnownFields from '../common/known-fields/states-inventory-processes.json';
import IndexPatternITHygieneProtocolsKnownFields from '../common/known-fields/states-inventory-protocols.json';
import IndexPatternITHygieneServicesKnownFields from '../common/known-fields/states-inventory-services.json';
import IndexPatternITHygieneSystemKnownFields from '../common/known-fields/states-inventory-system.json';
import IndexPatternITHygieneUsersKnownFields from '../common/known-fields/states-inventory-users.json';
import IndexPatternMonitoringKnownFields from '../common/known-fields/monitoring.json';
import IndexPatternSCAKnownFields from '../common/known-fields/states-sca.json';
import IndexPatternStatisticsKnownFields from '../common/known-fields/statistics.json';
import IndexPatternVulnerabilitiesKnownFields from '../common/known-fields/states-vulnerabilities.json';

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

  isAlertingDashboardsAvailable(plugins: PluginSetup): boolean {
    return !!plugins.alertingDashboards;
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('Wazuh-wui: Setup');

    const serverInfo = core.http.getServerInfo();

    core.http.registerRouteHandlerContext('wazuh', (context, request) => ({
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
    }));

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
        initializeDefaultNotificationChannel(
          notificationClient,
          this.isAlertingDashboardsAvailable(plugins),
        ),
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

    // server API run_as (allow_run_as)
    core.healthCheck.register(
      initializationTaskCreatorServerAPIRunAs({
        taskName: 'server-api:run-as',
        services: plugins.wazuhCore,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations(),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_AGENTS_MONITORING,
        indexPatternID: WAZUH_MONITORING_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist('timestamp'),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternMonitoringKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_SERVER_STATISTICS,
        indexPatternID: WAZUH_STATISTICS_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist('timestamp'),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternStatisticsKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES,
        indexPatternID: WAZUH_VULNERABILITIES_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternVulnerabilitiesKnownFields,
        },
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
          fieldsNoIndices: IndexPatternITHygieneInventoryKnownFields,
        },
        indexPatternID: WAZUH_IT_HYGIENE_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_GROUPS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_GROUPS_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneGroupsKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HARDWARE_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
        options: {
          savedObjectOverwrite: mapFieldsFormat({
            'host.memory.free': 'bytes',
            'host.memory.total': 'bytes',
            'host.memory.used': 'bytes',
            'host.memory.usage': 'percent',
          }),
          fieldsNoIndices: IndexPatternITHygieneHardwareKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HOTFIXES_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneHotfixesKnownFields,
        },
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
          fieldsNoIndices: IndexPatternITHygieneInterfacesKnownFields,
        },
        indexPatternID: WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_NETWORKS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneNetworkKnownFields,
        },
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
          fieldsNoIndices: IndexPatternITHygienePackagesKnownFields,
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
          fieldsNoIndices: IndexPatternITHygienePortsKnownFields,
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
          fieldsNoIndices: IndexPatternITHygieneProcessesKnownFields,
        },
        indexPatternID: WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROTOCOLS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneProtocolsKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SYSTEM_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneSystemKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_USERS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_USERS_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneUsersKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SERVICES_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_SERVICES_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneServicesKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName:
          HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_BROWSER_EXTENSIONS_STATES,
        indexPatternID: WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternITHygieneBrowserExtensionsKnownFields,
        },
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
          fieldsNoIndices: IndexPatternFIMFilesKnownFields,
        },
        indexPatternID: WAZUH_FIM_FILES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES,
        indexPatternID: WAZUH_FIM_REGISTRY_KEYS_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternFIMRegistriesKeysKnownFields,
        },
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
          fieldsNoIndices: IndexPatternFIMRegistriesValuesKnownFields,
        },
        indexPatternID: WAZUH_FIM_REGISTRY_VALUES_PATTERN,
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES,
        indexPatternID: WAZUH_SCA_PATTERN,
        options: {
          fieldsNoIndices: IndexPatternSCAKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SYSTEM_ACTIVITY,
        indexPatternID: WAZUH_EVENTS_SYSTEM_ACTIVITY_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsSystemActivityKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SECURITY,
        indexPatternID: WAZUH_EVENTS_SECURITY_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsSecurityKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_ACCESS_MANAGEMENT,
        indexPatternID: WAZUH_EVENTS_ACCESS_MANAGEMENT_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsAccessManagementKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_APLICATIONS,
        indexPatternID: WAZUH_EVENTS_APLICATIONS_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsApplicationsKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_OTHER,
        indexPatternID: WAZUH_EVENTS_OTHER_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsOtherKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_NETWORK_ACTIVITY,
        indexPatternID: WAZUH_EVENTS_NETWORK_ACTIVITY_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsNetworkActivityKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES,
        indexPatternID: WAZUH_EVENTS_CLOUD_SERVICES_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsCloudServicesKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES_AWS,
        indexPatternID: WAZUH_EVENTS_CLOUD_SERVICES_AWS_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsCloudServicesAWSKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES_AZURE,
        indexPatternID: WAZUH_EVENTS_CLOUD_SERVICES_AZURE_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsCloudServicesAzureKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES_GCP,
        indexPatternID: WAZUH_EVENTS_CLOUD_SERVICES_GCP_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsCloudServicesGCPKnownFields,
        },
      }),
    );

    core.healthCheck.register(
      initializationTaskCreatorIndexPattern({
        services: plugins.wazuhCore,
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS,
        indexPatternID: WAZUH_EVENTS_PATTERN,
        options: {
          savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
          hasTimeFieldName: true,
          fieldsNoIndices: IndexPatternEventsKnownFields,
          checkDefaultIndexPattern: true,
        },
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
