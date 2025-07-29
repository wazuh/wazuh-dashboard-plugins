// Request DTOs
export interface CreateModelGroupRequest {
  name: string;
  description: string;
}

export interface CreateConnectorRequest {
  name: string;
  description: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface CreateModelRequest {
  name: string;
  modelGroupId: string;
  description: string;
  connectorId: string;
}

export interface TestModelConnectionRequest {
  modelId: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  modelId: string;
}

export interface RegisterAgentRequest {
  agentId: string;
}