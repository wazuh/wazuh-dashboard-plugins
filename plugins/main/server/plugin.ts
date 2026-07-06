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

import path from 'path';
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
  IndexPatternTaskDefinition,
  initializationTaskCreatorIndexPatternBatch,
  initializationTaskCreatorServerAPIConnectionCompatibility,
  initializationTaskCreatorServerAPIRunAs,
  mapFieldsFormat,
} from './health-check';
import { initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations } from './health-check';
import {
  FIELD_TIMESTAMP,
  HEALTH_CHECK_TASK_INDEX_PATTERNS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_METRICS_AGENTS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_ACCESS_MANAGEMENT,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_APLICATIONS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_NETWORK_ACTIVITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_OTHER,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SECURITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SYSTEM_ACTIVITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_UNCLASSIFIED,
  HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_RAW,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_ACCESS_MANAGEMENT,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_APPLICATIONS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_CLOUD_SERVICES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_NETWORK_ACTIVITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_OTHER,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_SECURITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_SYSTEM_ACTIVITY,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_UNCLASSIFIED,
  HEALTH_CHECK_TASK_INDEX_PATTERN_THREATINTEL_ENRICHMENTS,
  WAZUH_THREATINTEL_ENRICHMENTS_PATTERN,
  HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_STATES,
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
  HEALTH_CHECK_TASK_INDEX_PATTERN_METRICS_COMMS,
  HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES,
  WAZUH_EVENTS_PATTERN,
  WAZUH_EVENTS_ACCESS_MANAGEMENT_PATTERN,
  WAZUH_EVENTS_APLICATIONS_PATTERN,
  WAZUH_EVENTS_CLOUD_SERVICES_PATTERN,
  WAZUH_EVENTS_NETWORK_ACTIVITY_PATTERN,
  WAZUH_EVENTS_OTHER_PATTERN,
  WAZUH_EVENTS_SECURITY_PATTERN,
  WAZUH_EVENTS_SYSTEM_ACTIVITY_PATTERN,
  WAZUH_EVENTS_UNCLASSIFIED_PATTERN,
  WAZUH_EVENTS_RAW_PATTERN,
  WAZUH_FINDINGS_PATTERN,
  WAZUH_FINDINGS_ACCESS_MANAGEMENT_PATTERN,
  WAZUH_FINDINGS_APPLICATIONS_PATTERN,
  WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
  WAZUH_FINDINGS_NETWORK_ACTIVITY_PATTERN,
  WAZUH_FINDINGS_OTHER_PATTERN,
  WAZUH_FINDINGS_SECURITY_PATTERN,
  WAZUH_FINDINGS_SYSTEM_ACTIVITY_PATTERN,
  WAZUH_FINDINGS_UNCLASSIFIED_PATTERN,
  WAZUH_FIM_PATTERN,
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
  WAZUH_METRICS_AGENTS_PATTERN,
  WAZUH_SCA_PATTERN,
  WAZUH_METRICS_COMMS_PATTERN,
  WAZUH_METRICS_NORMALIZATION_PATTERN,
  WAZUH_VULNERABILITIES_PATTERN,
  WAZUH_ACTIVE_RESPONSES_PATTERN,
  HEALTH_CHECK_TASK_INDEX_PATTERN_ACTIVE_RESPONSES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_METRICS_NORMALIZATION,
  WAZUH_DISABLED_SETTING_INDEX_RAW_EVENTS,
} from '../common/constants';

import { notificationSetup } from './health-check/notification-default-channels';
import { initializeDefaultNotificationChannel } from './health-check/notification-default-channels/tasks';
import { WazuhPluginConfigType } from './config';

// Resolve a known-fields JSON file path. The files are intentionally not
// imported statically: they are large and only needed when an index pattern
// must be created. The index-pattern health-check task reads the file from disk
// on demand so the parsed objects are not pinned in memory for the whole
// process lifetime.
const knownFieldsFilePath = (fileName: string) =>
  path.resolve(__dirname, '../common/known-fields', fileName);

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

// All 44 index-pattern definitions processed in batches during startup to limit
// peak concurrent connections to the indexer (see issue #8641).
const INDEX_PATTERN_HEALTH_CHECK_DEFINITIONS: IndexPatternTaskDefinition[] = [
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_METRICS_AGENTS,
    indexPatternID: WAZUH_METRICS_AGENTS_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist('@timestamp'),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('metrics-agents.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_METRICS_COMMS,
    indexPatternID: WAZUH_METRICS_COMMS_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist('@timestamp'),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('metrics-comms.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_METRICS_NORMALIZATION,
    indexPatternID: WAZUH_METRICS_NORMALIZATION_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist('@timestamp'),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'metrics-normalization.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_VULNERABILITIES_STATES,
    indexPatternID: WAZUH_VULNERABILITIES_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-vulnerabilities.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_PATTERN,
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
      fieldsNoIndicesFilePath: knownFieldsFilePath('states-inventory.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_GROUPS_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_GROUPS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-groups.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HARDWARE_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'host.memory.free': 'bytes',
        'host.memory.total': 'bytes',
        'host.memory.used': 'bytes',
        'host.memory.usage': 'percent',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-hardware.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HOTFIXES_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-hotfixes.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_INTERFACES_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'host.network.egress.bytes': 'bytes',
        'host.network.ingress.bytes': 'bytes',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-interfaces.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_NETWORKS_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-networks.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PACKAGES_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'package.size': 'bytes',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-packages.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PORTS_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_PORTS_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'destination.port': 'integer',
        'process.pid': 'integer',
        'source.port': 'integer',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-ports.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROCESSES_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'process.parent.pid': 'integer',
        'process.pid': 'integer',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-processes.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROTOCOLS_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-protocols.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SYSTEM_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-system.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_USERS_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_USERS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-users.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SERVICES_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_SERVICES_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-services.json',
      ),
    },
  },
  {
    taskName:
      HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_BROWSER_EXTENSIONS_STATES,
    indexPatternID: WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-inventory-browser-extensions.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_STATES,
    indexPatternID: WAZUH_FIM_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'file.size': 'bytes',
        'registry.size': 'bytes',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath('states-fim.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_FILES_STATES,
    indexPatternID: WAZUH_FIM_FILES_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'file.size': 'bytes',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath('states-fim-files.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_STATES,
    indexPatternID: WAZUH_FIM_REGISTRY_KEYS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-fim-registries-keys.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FIM_REGISTRY_VALUES_STATES,
    indexPatternID: WAZUH_FIM_REGISTRY_VALUES_PATTERN,
    options: {
      savedObjectOverwrite: mapFieldsFormat({
        'registry.size': 'bytes',
      }),
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'states-fim-registries-values.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_SCA_STATES,
    indexPatternID: WAZUH_SCA_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath('states-sca.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SYSTEM_ACTIVITY,
    indexPatternID: WAZUH_EVENTS_SYSTEM_ACTIVITY_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'events-system-activity.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_SECURITY,
    indexPatternID: WAZUH_EVENTS_SECURITY_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('events-security.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_ACCESS_MANAGEMENT,
    indexPatternID: WAZUH_EVENTS_ACCESS_MANAGEMENT_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'events-access-management.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_APLICATIONS,
    indexPatternID: WAZUH_EVENTS_APLICATIONS_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('events-applications.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_OTHER,
    indexPatternID: WAZUH_EVENTS_OTHER_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('events-other.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_NETWORK_ACTIVITY,
    indexPatternID: WAZUH_EVENTS_NETWORK_ACTIVITY_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'events-network-activity.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_CLOUD_SERVICES,
    indexPatternID: WAZUH_EVENTS_CLOUD_SERVICES_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'events-cloud-services.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS,
    indexPatternID: WAZUH_EVENTS_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('events.json'),
      checkDefaultIndexPattern: true,
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_ACTIVE_RESPONSES,
    indexPatternID: WAZUH_ACTIVE_RESPONSES_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('active-responses.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_UNCLASSIFIED,
    indexPatternID: WAZUH_EVENTS_UNCLASSIFIED_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('events-unclassified.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_EVENTS_RAW,
    indexPatternID: WAZUH_EVENTS_RAW_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('events-raw.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_SYSTEM_ACTIVITY,
    indexPatternID: WAZUH_FINDINGS_SYSTEM_ACTIVITY_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'findings-system-activity.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_SECURITY,
    indexPatternID: WAZUH_FINDINGS_SECURITY_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('findings-security.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_ACCESS_MANAGEMENT,
    indexPatternID: WAZUH_FINDINGS_ACCESS_MANAGEMENT_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'findings-access-management.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_APPLICATIONS,
    indexPatternID: WAZUH_FINDINGS_APPLICATIONS_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'findings-applications.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_OTHER,
    indexPatternID: WAZUH_FINDINGS_OTHER_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('findings-other.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_NETWORK_ACTIVITY,
    indexPatternID: WAZUH_FINDINGS_NETWORK_ACTIVITY_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'findings-network-activity.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_CLOUD_SERVICES,
    indexPatternID: WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'findings-cloud-services.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS_UNCLASSIFIED,
    indexPatternID: WAZUH_FINDINGS_UNCLASSIFIED_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'findings-unclassified.json',
      ),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_FINDINGS,
    indexPatternID: WAZUH_FINDINGS_PATTERN,
    options: {
      savedObjectOverwrite: defineTimeFieldNameIfExist(FIELD_TIMESTAMP),
      hasTimeFieldName: true,
      fieldsNoIndicesFilePath: knownFieldsFilePath('findings.json'),
    },
  },
  {
    taskName: HEALTH_CHECK_TASK_INDEX_PATTERN_THREATINTEL_ENRICHMENTS,
    indexPatternID: WAZUH_THREATINTEL_ENRICHMENTS_PATTERN,
    options: {
      fieldsNoIndicesFilePath: knownFieldsFilePath(
        'threatintel-enrichments.json',
      ),
    },
  },
];

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

    // Wazuh: register capabilities based on disabledSettings config
    const config$ =
      this.initializerContext.config.create<WazuhPluginConfigType>();
    const config = await config$.pipe(first()).toPromise();

    core.capabilities.registerProvider(() => ({
      wazuh: {
        showIndexRawEvents: true,
      },
    }));

    core.capabilities.registerSwitcher(() => ({
      wazuh: {
        showIndexRawEvents: !config.disabledSettings.includes(
          WAZUH_DISABLED_SETTING_INDEX_RAW_EVENTS,
        ),
      },
    }));

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

    // Register all index-pattern tasks as a single batched health-check task,
    // processing up to 5 patterns concurrently to limit peak indexer connections.
    core.healthCheck.register(
      initializationTaskCreatorIndexPatternBatch({
        taskName: HEALTH_CHECK_TASK_INDEX_PATTERNS,
        batchSize: 5,
        indexPatterns: INDEX_PATTERN_HEALTH_CHECK_DEFINITIONS,
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
