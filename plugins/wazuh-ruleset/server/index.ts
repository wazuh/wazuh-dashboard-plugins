import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhRulesetPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhRulesetPlugin(initializerContext);
}

export { WazuhRulesetPluginSetup, WazuhRulesetPluginStart } from './types';
