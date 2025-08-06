import { AgentTool } from '../../domain/entities/agent-tool';

export class AgentToolFactory {
  public static create(params: {
    type: string;
    name?: string;
    description?: string;
    parameters?: Record<string, any>;
  }): AgentTool {
    const tool: AgentTool = { type: params.type };
    if (params.name) {
      tool.name = params.name;
    }
    if (params.description) {
      tool.description = params.description;
    }
    if (params.parameters) {
      tool.parameters = params.parameters;
    }
    return tool as AgentTool;
  }
}
