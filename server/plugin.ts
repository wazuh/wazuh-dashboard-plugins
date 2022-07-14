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
  SharedGlobalConfig
} from 'kibana/server';

import { WazuhPluginSetup, WazuhPluginStart, PluginSetup } from './types';
import { SecurityObj, ISecurityFactory } from './lib/security-factory';
import { setupRoutes } from './routes';
import { jobInitializeRun, jobMonitoringRun, jobSchedulerRun, jobQueueRun, jobMigrationTasksRun } from './start';
import { getCookieValueByName } from './lib/cookie';
import * as ApiInterceptor  from './lib/api-interceptor';
import { schema, TypeOf } from '@kbn/config-schema';
import type { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

declare module 'kibana/server' {
  interface RequestHandlerContext {
    wazuh: {
      logger: Logger,
      plugins: PluginSetup,
      security: ISecurityFactory
      api: {
        client: {
          asInternalUser: {
            authenticate: (apiHostID: string) => Promise<string>
            request: (method: string, path: string, data: any, options: {apiHostID: string, forceRefresh?:boolean}) => Promise<any>
          },
          asCurrentUser: {
            authenticate: (apiHostID: string) => Promise<string>
            request: (method: string, path: string, data: any, options: {apiHostID: string, forceRefresh?:boolean}) => Promise<any>
          }
        }
      }
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

    let wazuhSecurity;
    core.http.registerRouteHandlerContext('wazuh', async(context, request) => {
      !wazuhSecurity && (wazuhSecurity = await SecurityObj(plugins, context));
      return {
        logger: this.logger,
        server: {
          info: serverInfo, 
        },
        plugins,
        security: wazuhSecurity,
        api: {
          client: {
            asInternalUser: {
              authenticate: async (apiHostID) => await ApiInterceptor.authenticate(apiHostID),
              request: async (method, path, data, options) => await ApiInterceptor.requestAsInternalUser(method, path, data, options),
            },
            asCurrentUser: {
              authenticate: async (apiHostID) => await ApiInterceptor.authenticate(apiHostID, (await wazuhSecurity.getCurrentUser(request, context)).authContext),
              request: async (method, path, data, options) => await ApiInterceptor.requestAsCurrentUser(method, path, data, {...options, token: getCookieValueByName(request.headers.cookie, 'wz-token')}),
            }
          }
        }
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
    setupRoutes(router);

    return {};
  }

  public async start(core: CoreStart) {
    const globalConfiguration: SharedGlobalConfig = await this.initializerContext.config.legacy.globalConfig$.pipe(first()).toPromise();
    const wazuhApiClient = {
      client: {
        asInternalUser: {
          authenticate: async (apiHostID) => await ApiInterceptor.authenticate(apiHostID),
          request: async (method, path, data, options) => await ApiInterceptor.requestAsInternalUser(method, path, data, options),
        }
      }
    };

    const contextServer = {
      config: globalConfiguration
    };

    // Initialize
    jobInitializeRun({
      core, 
      wazuh: {
        logger: this.logger.get('initialize'),
        api: wazuhApiClient
      },
      server: contextServer
    });

    // Migration tasks
    jobMigrationTasksRun({
      core, 
      wazuh: {
        logger: this.logger.get('migration-task'),
        api: wazuhApiClient
      },
      server: contextServer
    });

    // Monitoring
    jobMonitoringRun({
      core,
      wazuh: {
        logger: this.logger.get('monitoring'),
        api: wazuhApiClient
      },
      server: contextServer
    });

    // Scheduler
    jobSchedulerRun({
      core,
      wazuh: {
        logger: this.logger.get('cron-scheduler'),
        api: wazuhApiClient
      },
      server: contextServer
    });

    // Queue
    jobQueueRun({
      core, 
      wazuh: {
        logger: this.logger.get('queue'),
        api: wazuhApiClient
      },
      server: contextServer
    });
    return {};
  }

  public stop() { }
}
