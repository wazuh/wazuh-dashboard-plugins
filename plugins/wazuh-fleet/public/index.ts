import { WazuhFleetPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new WazuhFleetPlugin();
}
export { WazuhFleetPluginSetup, WazuhFleetPluginStart } from './types';
