import { schema, TypeOf } from '@osd/config-schema';
import {
  PluginConfigDescriptor,
  PluginInitializerContext,
} from '../../../src/core/server';
import { WAZUH_CTI_CONSOLE_BASE_URL } from '../common/constants';
import { WazuhCheckUpdatesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhCheckUpdatesPlugin(initializerContext);
}

export const configSchema = schema.object({
  ctiRegistrationUiEnabled: schema.boolean({ defaultValue: false }),
  ctiRegistrationStatusPollIntervalSec: schema.number({ defaultValue: 30 }),
  /**
   * Base URL of the CTI API. Not present in the shipped configuration file:
   * override it only to target another CTI environment (pre, production or the
   * local Imposter mock, see `docker/imposter/cti/README.md`).
   */
  ctiApiUrl: schema.uri({
    scheme: ['http', 'https'],
    defaultValue: WAZUH_CTI_CONSOLE_BASE_URL,
  }),
});

export type WazuhCheckUpdatesPluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<WazuhCheckUpdatesPluginConfigType> =
  {
    exposeToBrowser: {
      ctiRegistrationUiEnabled: true,
      ctiRegistrationStatusPollIntervalSec: true,
    },
    schema: configSchema,
  };

export {
  WazuhCheckUpdatesPluginSetup,
  WazuhCheckUpdatesPluginStart,
} from './types';
