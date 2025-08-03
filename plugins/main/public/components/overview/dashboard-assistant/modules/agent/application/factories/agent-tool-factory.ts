import { AgentTool } from '../../domain/entities/agent-tool';

export class AgentToolFactory {
  public static create(
    type: string,
    name?: string,
    description?: string,
    parameters?: Record<string, any>,
  ): AgentTool {
    const tool: AgentTool = { type };
    if (name) {
      tool.name = name;
    }
    if (description) {
      tool.description = description;
    }
    if (parameters) {
      tool.parameters = parameters;
    }
    return tool as AgentTool;
  }
}
