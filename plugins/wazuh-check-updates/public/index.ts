import { PluginInitializerContext } from 'opensearch-dashboards/public';
import type { WazuhCheckUpdatesPluginConfigType } from '../server/index';
import { WazuhCheckUpdatesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin(
  initializerContext: PluginInitializerContext<WazuhCheckUpdatesPluginConfigType>,
) {
  return new WazuhCheckUpdatesPlugin(initializerContext);
}
export { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
