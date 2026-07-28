import { PluginInitializerContext } from '../../../src/core/server';
import { WazuhAiAssistantPlugin } from './plugin';

export { config } from './config';
export type { WazuhAiAssistantConfigType } from './config';
export type {
  WazuhAiAssistantPluginSetup,
  WazuhAiAssistantPluginStart,
} from './types';

export function plugin(
  initializerContext: PluginInitializerContext,
): WazuhAiAssistantPlugin {
  return new WazuhAiAssistantPlugin(initializerContext);
}
