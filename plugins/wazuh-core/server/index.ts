import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhCorePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCorePlugin(initializerContext);
}

export type { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
export type { IConfigurationEnhanced } from './services/enhance-configuration';
