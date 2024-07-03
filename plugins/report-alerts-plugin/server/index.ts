/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../src/core/server';
import { ReportingConfigType } from './config';
import { ReportsDashboardsPlugin } from './plugin';

export { config } from './config';
export { ReportingConfig } from './config/config';
export { ReportsDashboardsPlugin as Plugin };

//  This exports static code and TypeScript types,
//  as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin(
  initializerContext: PluginInitializerContext<ReportingConfigType>
) {
  return new ReportsDashboardsPlugin(initializerContext);
}

export {
  ReportsDashboardsPluginSetup,
  ReportsDashboardsPluginStart,
} from './types';
