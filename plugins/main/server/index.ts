import { PluginInitializerContext } from 'kibana/server';

import { WazuhPlugin } from './plugin';

//  This exports static code and TypeScript types,
//  as well as, plugin platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WazuhPlugin(initializerContext);
}

export { WazuhPluginSetup, WazuhPluginStart } from './types';
