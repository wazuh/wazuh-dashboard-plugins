import { PluginConfigDescriptor, PluginInitializerContext } from '../../../src/core/server';
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

// Define the schema for the hosts config with dynamic keys
const hostsConfigSchema = schema.recordOf(schema.string(), hostSchema);

export const configSchema = schema.object({
  hosts: hostsConfigSchema,
});

export type CorePluginConfigType = TypeOf<typeof configSchema>;


export const config: PluginConfigDescriptor<CorePluginConfigType> = {
  exposeToBrowser: {
    hosts: true,
    pattern: true,
    vulnerabilityPattern: true,
  },
  schema: configSchema,
}


export type { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
export type { IConfigurationEnhanced } from './services/configuration/enhance-configuration';
