import type { ProviderModelConfig } from '../../../../provider-model-config';

export interface CreateModelGroupRequest {
  name: string;
  description: string;
}

export interface CreateConnectorRequest {
  name: string;
  description: string;
  endpoint: string;
  modelId: string;
  model: ProviderModelConfig;
  apiKey: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  modelId: string;
}

export interface RegisterAgentRequest {
  agentId: string;
}
