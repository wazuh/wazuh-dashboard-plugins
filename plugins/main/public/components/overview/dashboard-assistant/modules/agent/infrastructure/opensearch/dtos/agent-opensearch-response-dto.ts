export interface AgentOpenSearchResponseDto {
  created_time?: number;
  memory?: Memory;
  app_type?: string;
  last_updated_time?: number;
  is_hidden?: boolean;
  name: string;
  description: string;
  type: string;
  llm: Llm;
  tools: Tool[];
}

export interface Llm {
  model_id: string;
  parameters: LlmParameters;
}

export interface LlmParameters {
  max_iteration?: string;
  stop_when_no_tool_found?: string;
  response_filter?: string;
  max_tokens?: string;
}

export interface Memory {
  type: string;
}

export interface Tool {
  name: string;
  description: string;
  include_output_in_agent_response?: boolean;
  type: string;
  parameters: ToolParameters;
}

export interface ToolParameters {
  model_id?: string;
  prompt?: string;
  input?: string;
}
