export interface AgentTool {
  type: string;
  name?: string;
  description?: string;
  parameters?: Record<string, any>;
  include_output_in_agent_response: boolean;
  config: any;
}
