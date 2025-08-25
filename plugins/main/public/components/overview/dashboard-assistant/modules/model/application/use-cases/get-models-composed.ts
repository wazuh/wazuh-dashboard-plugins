import { ModelWithAgent } from '../../domain/entities/model-with-agent';
import { ModelWithAgentMapper } from '../../domain/mappers/model-with-agent-mapper';
import { ModelsComposed } from '../dtos/models-composed';
import { ModelRepository } from '../ports/model-repository';
import { AgentRepository } from '../../../agent/application/ports/agent-repository';
import { AssistantRepository } from '../../../assistant/application/ports/assistant-repository';

export const getModelsComposedUseCase = (
  modelRepository: ModelRepository,
  agentRepository: AgentRepository,
  assistantRepository: AssistantRepository,
) => {
  return async (): Promise<ModelsComposed[]> => {
    const models = await modelRepository.getAll();

    const modelsWithAgents = await Promise.all(
      models.map(async model => {
        try {
          const agent = await agentRepository.findByModelId(model.id);

          return {
            ...model,
            agentId: agent?.id,
            agentName: agent?.name,
          } as ModelWithAgent;
        } catch (error) {
          return {
            ...model,
            agentId: undefined,
            agentName: undefined,
          } as ModelWithAgent;
        }
      }),
    );

    const assistantConfig = await assistantRepository.getConfig();
    const activeAgentId = assistantConfig?._source?.configuration?.agent_id;

    return ModelWithAgentMapper.toTableData(modelsWithAgents, activeAgentId);
  };
};
