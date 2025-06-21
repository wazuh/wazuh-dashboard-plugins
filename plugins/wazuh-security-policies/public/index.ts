import './index.scss';
import { WazuhSecurityPoliciesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new WazuhSecurityPoliciesPlugin();
}

export {
  WazuhSecurityPoliciesPluginSetup,
  WazuhSecurityPoliciesPluginStart,
} from './types';
