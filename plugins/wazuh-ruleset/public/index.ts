import './index.scss';

import { WazuhRulesetPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new WazuhRulesetPlugin();
}
export { WazuhRulesetPluginSetup, WazuhRulesetPluginStart } from './types';
