import './index.scss';

import { PocPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new PocPluginPlugin();
}
export { PocPluginPluginSetup, PocPluginPluginStart } from './types';
