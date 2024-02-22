import { PluginInitializerContext } from '../../../src/core/server';
import {
  WAZUH_CORE_CONFIGURATION_INSTANCE,
  WAZUH_CORE_ENCRYPTION_PASSWORD,
} from '../common/constants';
import { WazuhCorePlugin } from './plugin';
import { schema, TypeOf } from '@osd/config-schema';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCorePlugin(initializerContext);
}

const configSchema = schema.object({
  instance: schema.string({
    defaultValue: WAZUH_CORE_CONFIGURATION_INSTANCE,
  }),
  configuration: schema.object({
    encryption_key: schema.string({
      defaultValue: WAZUH_CORE_ENCRYPTION_PASSWORD,
    }),
  }),
});

export const config = {
  schema: configSchema,
};

export type WazuhCorePluginConfigType = TypeOf<typeof configSchema>;

export { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
