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

import { Observable } from 'rxjs';

export interface WazuhPluginSetup {}

export interface WazuhPluginStart {}

/**
 * Subset of the OpenSearch Dashboards Security plugin setup contract that we
 * consume. The plugin returns `{ config$, securityConfigClient }` from its
 * `setup()`, but types it as an empty interface, so we declare the shape here.
 * Every access is optional: the plugin is an optional dependency, and the
 * contract is undocumented, so a future upstream change must degrade to the
 * caller's default rather than throw.
 */
export interface SecurityDashboardsSetup {
  config$?: Observable<{
    cookie?: { isSameSite?: 'Strict' | 'Lax' | 'None' | false };
  }>;
}

export type PluginSetup = {
  securityDashboards?: SecurityDashboardsSetup;
  wazuhCore: {};
  // Optional Notifications Dashboards plugin contract presence check
  notificationsDashboards?: {};
};
