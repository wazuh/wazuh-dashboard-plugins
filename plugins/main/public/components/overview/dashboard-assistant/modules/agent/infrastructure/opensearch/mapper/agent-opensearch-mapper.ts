import { Agent } from '../../../domain/entities/agent';
import { AgentOpenSearchRequestDto } from '../dtos/agent-opensearch-request-dto';
import { AgentOpenSearchResponseDto } from '../dtos/agent-opensearch-response-dto';

export class AgentOpenSearchMapper {
  public static fromResponse(
    id: string,
    dto: AgentOpenSearchResponseDto | AgentOpenSearchRequestDto,
  ): Agent {
    return {
      id,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      model_id: dto.llm.model_id,
      tools: dto.tools || [],
    };
  }
}
