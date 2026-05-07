import { schema, TypeOf } from '@osd/config-schema';
import {
  PluginConfigDescriptor,
  PluginInitializerContext,
} from '../../../src/core/server';
import { WazuhCheckUpdatesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCheckUpdatesPlugin(initializerContext);
}

export const configSchema = schema.object({
  ctiRegistrationUiEnabled: schema.boolean({ defaultValue: false }),
});

export type WazuhCheckUpdatesPluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<WazuhCheckUpdatesPluginConfigType> = {
  exposeToBrowser: {
    ctiRegistrationUiEnabled: true,
  },
  schema: configSchema,
};

export { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
