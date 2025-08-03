import { AgentLLM } from '../../domain/entities/agent-llm';

export class AgentLLMFactory {
  private static get defaultParameters(): Record<string, any> {
    return {
      max_iteration: 3,
      stop_when_no_tool_found: true,
    };
  }

  public static create(
    modelId: string,
    response_filter: string,
    extra_parameters?: Record<string, any>,
  ): AgentLLM {
    return {
      model_id: modelId,
      parameters: {
        response_filter,
        ...this.defaultParameters,
        ...extra_parameters,
      },
    } as AgentLLM;
  }
}
