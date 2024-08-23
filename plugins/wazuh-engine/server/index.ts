import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhEnginePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhEnginePlugin(initializerContext);
}

export type { WazuhEnginePluginSetup, WazuhEnginePluginStart } from './types';
