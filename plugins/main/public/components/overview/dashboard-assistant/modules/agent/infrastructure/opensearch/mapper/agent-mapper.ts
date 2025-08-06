import { Agent } from '../../../domain/entities/agent';
import { AgentOpenSearchRequestDto } from '../dtos/agent-opensearch-request-dto';
import { AgentOpenSearchResponseDto } from '../dtos/agent-opensearch-response-dto';

export class AgentMapper {
  public static fromRequest(
    agentId: string,
    dto: AgentOpenSearchRequestDto,
  ): Agent {
    return {
      id: agentId,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      llm: dto.llm,
      tools: dto.tools || [],
    };
  }

  public static fromResponse(
    id: string,
    dto: AgentOpenSearchResponseDto,
  ): Agent {
    return {
      id,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      llm: dto.llm,
      tools: dto.tools || [],
    };
  }
}
