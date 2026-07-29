import { WazuhAiAssistantPlugin } from './plugin';

export type {
  WazuhAiAssistantPluginSetup,
  WazuhAiAssistantPluginStart,
} from './types';

export function plugin(): WazuhAiAssistantPlugin {
  return new WazuhAiAssistantPlugin();
}
