import { PluginConfigDescriptor, PluginInitializerContext } from '../../../src/core/server';
import { PLUGIN_SETTINGS } from '../common/constants';
import { getConfigSettingsDefinitions } from '../common/settings-adapter';
import { WazuhCorePlugin } from './plugin';
import { schema, TypeOf } from '@osd/config-schema';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCorePlugin(initializerContext);
}
// Define the schema for a single host entry
const hostSchema = schema.object({
  url: schema.string(),
  port: schema.number(),
  username: schema.string(),
  password: schema.string(),
  run_as: schema.boolean()
});

const initiliazerConfig = getConfigSettingsDefinitions(PLUGIN_SETTINGS);
export const configSchema = schema.object(initiliazerConfig);
export type CorePluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<CorePluginConfigType> = {
  exposeToBrowser: {
    hosts: true,
  },
  schema: configSchema,
}


export type { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
export * from './types';