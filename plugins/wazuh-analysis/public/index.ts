import { AnalysisPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as the OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new AnalysisPlugin();
}

export type { AnalysisSetup, AnalysisStart } from './types';
