import {
  PluginConfigDescriptor,
  PluginInitializerContext,
} from 'opensearch_dashboards/server';

import { WazuhPlugin } from './plugin';
import { configSchema, WazuhPluginConfigType } from './config';

//  This exports static code and TypeScript types,
//  as well as, plugin platform `plugin()` initializer.

export const config: PluginConfigDescriptor<WazuhPluginConfigType> = {
  exposeToBrowser: {},
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhPlugin(initializerContext);
}

export { WazuhPluginSetup, WazuhPluginStart } from './types';
