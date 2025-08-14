import { AgentRepository } from '../../../agent/application/ports/agent-repository';
import { ConnectorRepository } from '../../../connector/application/ports/connector-repository';
import { ModelGroupRepository } from '../../../model-group/application/ports/model-group-repository';
import { Model } from '../../domain/entities/model';
import { ModelRepository } from '../ports/model-repository';

export const deleteModelWithRelatedEntitiesUseCase =
  (
    modelRepository: ModelRepository,
    connectorRepository: ConnectorRepository,
    modelGroupRepository: ModelGroupRepository,
    agentRepository: AgentRepository,
  ) =>
  async (modelId: Model['id']) => {
    const model = await modelRepository.findById(modelId);
    if (!model) {
      throw new Error('Model not found');
    }
    await modelRepository.delete(modelId);
    await connectorRepository.delete(model.connector_id);
    if (model.model_group_id) {
      await modelGroupRepository.delete(model.model_group_id);
    }
    await agentRepository.deleteByModelId(modelId);
  };
