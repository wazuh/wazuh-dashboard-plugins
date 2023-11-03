import { WazuhCorePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new WazuhCorePlugin();
}
export { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
