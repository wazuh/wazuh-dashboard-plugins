import { PluginInitializer, PluginInitializerContext } from 'kibana/public';
import { WazuhPlugin } from './plugin';
import { WazuhSetup, WazuhSetupPlugins, WazuhStart, WazuhStartPlugins } from './types';

export const plugin: PluginInitializer<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins> = (
  initializerContext: PluginInitializerContext
) => {
  return new WazuhPlugin(initializerContext);
};

// These are your public types & static code
export { WazuhSetup, WazuhStart };
