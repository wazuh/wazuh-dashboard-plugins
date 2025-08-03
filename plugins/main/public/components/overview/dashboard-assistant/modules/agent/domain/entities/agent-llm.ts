export interface AgentLLM {
  model_id: string;
  parameters: {
    max_iteration?: number;
    stop_when_no_tool_found?: boolean;
    response_filter: string;
    [key: string]: any; // Allow additional parameters
  };
}
