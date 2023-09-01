import './index.scss';

import { WazuhCheckUpdatesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new WazuhCheckUpdatesPlugin();
}
export { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
