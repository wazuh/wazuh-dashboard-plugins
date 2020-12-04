import { PluginInitializer, PluginInitializerContext } from 'kibana/public';
import { WazuhPlugin } from './plugin';
import { WazuhSetup, WazuhSetupDeps, WazuhStart, WazuhStartDeps } from './types';

export const plugin: PluginInitializer<WazuhSetup, WazuhStart, WazuhSetupDeps, WazuhStartDeps> = (
  initializerContext: PluginInitializerContext
) => {
  return new WazuhPlugin();
};

// These are your public types & static code
export { WazuhSetup, WazuhStart };
