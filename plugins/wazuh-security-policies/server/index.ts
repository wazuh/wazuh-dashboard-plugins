import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhSecurityPoliciesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhSecurityPoliciesPlugin(initializerContext);
}

export {
  WazuhSecurityPoliciesPluginSetup,
  WazuhSecurityPoliciesPluginStart,
} from './types';
