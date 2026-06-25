import path from 'path';

export const DEFAULT_DEFINITIONS_FOLDER = path.resolve(
  __dirname,
  '../../../common/dashboards/dashboard-definitions',
);
export const DEFAULT_EXTENSION = '.ndjson';

// Every Wazuh owned dashboard/visualization saved object must have a
// `description` starting with this prefix so they can be reliably targeted by
// filters. It is applied automatically when the objects are provisioned
export const DESCRIPTION_PREFIX = 'Provided by Wazuh. ';
