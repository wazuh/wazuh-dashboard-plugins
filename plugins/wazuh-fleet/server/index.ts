import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhFleetPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhFleetPlugin(initializerContext);
}

export { WazuhFleetPluginSetup, WazuhFleetPluginStart } from './types';
