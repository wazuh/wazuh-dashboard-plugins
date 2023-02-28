import { PluginInitializerContext } from '../../../src/core/server';
import { PocPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new PocPluginPlugin(initializerContext);
}

export { PocPluginPluginSetup, PocPluginPluginStart } from './types';
