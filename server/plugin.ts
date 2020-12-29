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
import { jobMonitoringRun } from './start/monitoring';
import { jobSchedulerRun } from './lib/cron-scheduler';
import { jobInitializeRun } from './start/initialize';
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

    const wazuhSecurity = SecurityObj(plugins);

    core.http.registerRouteHandlerContext('wazuh', (context, request) => {
      return {
        logger: this.logger,
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

    // Monitoring
    jobMonitoringRun({
      core,
      wazuh: {
        logger: this.logger.get('monitoring'),
        api: wazuhApiClient
      },
      server: {
        config: globalConfiguration
      }
    });

    // Scheduler
    jobSchedulerRun({
      core,
      wazuh: {
        logger: this.logger.get('cron-scheduler'),
        api: wazuhApiClient
      },
      server: {
        config: globalConfiguration
      }
    });

    // Initialize
    jobInitializeRun({
      core,
      wazuh: {
        logger: this.logger.get('initialize'),
        api: wazuhApiClient
      },
      server: {
        config: globalConfiguration
      }
    })
    return {};
  }

  public stop() { }
}
