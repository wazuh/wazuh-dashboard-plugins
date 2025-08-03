export interface AgentTool {
  type: string;
  name?: string;
  description?: string;
  parameters?: Record<string, any>;
}
