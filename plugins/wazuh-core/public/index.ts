import { PluginInitializerContext } from 'opensearch-dashboards/public';
import { WazuhCorePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCorePlugin(initializerContext);
}

export { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
