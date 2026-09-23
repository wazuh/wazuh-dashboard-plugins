import { schema, TypeOf } from '@osd/config-schema';
import {
  PluginConfigDescriptor,
  PluginInitializerContext,
} from '../../../src/core/server';
import { PLUGIN_SETTINGS } from '../common/constants';
import { getConfigSettingsDefinitions } from '../common/settings-adapter';
import { WazuhCorePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCorePlugin(initializerContext);
}

const initiliazerConfig = getConfigSettingsDefinitions(PLUGIN_SETTINGS);

// Each setting validator sees one value; this one compares the two thresholds.
export const configSchema = schema.object(initiliazerConfig, {
  validate: (value: Record<string, unknown>) => {
    const warning = value.healthCheckCertificateExpiryWarningDays as number;
    const critical = value.healthCheckCertificateExpiryCriticalDays as number;

    if (critical >= warning) {
      return `[healthCheckCertificateExpiryCriticalDays] (${critical}) must be lower than [healthCheckCertificateExpiryWarningDays] (${warning})`;
    }
  },
});
export type CorePluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<CorePluginConfigType> = {
  exposeToBrowser: {},
  schema: configSchema,
};

export type { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
export * from './types';
