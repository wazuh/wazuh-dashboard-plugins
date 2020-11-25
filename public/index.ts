import { PluginInitializer, PluginInitializerContext } from 'kibana/server';
import { WazuhSetup, WazuhStart, WazuhSetupDeps, WazuhStartDeps, WazuhPlugin } from './plugin';

export const plugin = (
  initializerContext: PluginInitializerContext
) => {
  return new WazuhPlugin();
};

// These are your public types & static code
export { WazuhSetup, WazuhStart };
