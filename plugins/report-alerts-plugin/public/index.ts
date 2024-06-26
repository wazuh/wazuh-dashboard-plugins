import './index.scss';

import { ReportAlertsPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new ReportAlertsPluginPlugin();
}
export { ReportAlertsPluginPluginSetup, ReportAlertsPluginPluginStart } from './types';
