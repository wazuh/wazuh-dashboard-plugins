export interface AgentLLM {
  model_id: string;
  parameters: {
    max_iteration?: string;
    stop_when_no_tool_found?: string;
    response_filter?: string;
    [key: string]: any; // Allow additional parameters
  };
}
