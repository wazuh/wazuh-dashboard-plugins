import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhEndpointsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhEndpointsPlugin(initializerContext);
}

export { WazuhEndpointsPluginSetup, WazuhEndpointsPluginStart } from './types';
