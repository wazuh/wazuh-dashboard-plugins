import { PluginInitializerContext } from '../../../src/core/server';
import { ReportAlertsPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new ReportAlertsPluginPlugin(initializerContext);
}

export { ReportAlertsPluginPluginSetup, ReportAlertsPluginPluginStart } from './types';
