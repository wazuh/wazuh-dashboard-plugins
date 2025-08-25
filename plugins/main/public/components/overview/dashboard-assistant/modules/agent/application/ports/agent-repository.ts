import { CreateRepository } from '../../../common/domain/entities/repository';
import { Agent } from '../../domain/entities/agent';
import { CreateAgentDto } from '../dtos/create-agent-dto';

export interface AgentRepository
  extends CreateRepository<Agent, CreateAgentDto> {
  execute(id: string, parameters: any): Promise<any>;
  register(agentId: string): Promise<void>;
  getRegisterCommand(agentId: string): Promise<string>;
  findByModelId(modelId: string): Promise<Agent | null>;
  deleteByModelId(modelId: string): Promise<void>;
}
