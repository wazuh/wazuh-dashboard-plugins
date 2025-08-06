import { AgentLLMOpenSearchRequestDto } from '../dtos/agent-llm-opensearch-request-dto';

export class AgentLLMOpenSearchRequestFactory {
  private static get defaultParameters(): Record<string, any> {
    return {
      max_iteration: 3,
      stop_when_no_tool_found: true,
    };
  }

  public static create(params: {
    modelId: string;
    response_filter: string;
    extra_parameters?: Record<string, any>;
  }): AgentLLMOpenSearchRequestDto {
    return {
      model_id: params.modelId,
      parameters: {
        response_filter: params.response_filter,
        ...this.defaultParameters,
        ...params.extra_parameters,
      },
    };
  }
}
