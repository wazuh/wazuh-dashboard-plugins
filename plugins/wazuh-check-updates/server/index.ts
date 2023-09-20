import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhCheckUpdatesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCheckUpdatesPlugin(initializerContext);
}

export { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
