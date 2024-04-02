import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhCorePlugin } from './plugin';
import { TypeOf } from '@osd/config-schema';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCorePlugin(initializerContext);
}

export type WazuhCorePluginConfigType = TypeOf<typeof configSchema>;

export { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
