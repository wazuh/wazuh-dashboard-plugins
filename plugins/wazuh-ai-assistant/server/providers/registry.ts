import { ProviderType } from '../../common/constants';
import { ProviderAdapter } from './types';
import { OpenAiCompatibleAdapter } from './openai-compatible';
import { AnthropicAdapter } from './anthropic';
import { WazuhBrainAdapter } from './wazuh-brain';

const adapters: Record<ProviderType, ProviderAdapter> = {
  openai_compatible: new OpenAiCompatibleAdapter(),
  anthropic: new AnthropicAdapter(),
  wazuh_brain: new WazuhBrainAdapter(),
};

export function getProviderAdapter(type: ProviderType): ProviderAdapter {
  const adapter = adapters[type];
  if (!adapter) {
    throw new Error(`No provider adapter registered for type "${type}"`);
  }
  return adapter;
}
