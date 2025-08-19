import { ModelWithAgent } from '../entities/model-with-agent';
import { ModelsComposed } from '../../application/dtos/models-composed';

export class ModelWithAgentMapper {
  public static toTableData(
    models: ModelWithAgent[], 
    activeAgentId?: string
  ): ModelsComposed[] {
    return models.map(model => ({
      name: model.name,
      id: model.id,
      version: model.version,
      status: !model.agentId ? 'inactive': model.status,
      createdAt: model.created_at,
      agentId: model.agentId,
      agentName: model.agentName,
      inUse: model.agentId === activeAgentId,
    }));
  }
}