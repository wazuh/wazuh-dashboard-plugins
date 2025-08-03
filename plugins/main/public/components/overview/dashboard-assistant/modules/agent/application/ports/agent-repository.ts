import { CreateRepository } from '../../../common/domain/repository';
import { Agent } from '../../domain/entities/agent';
import { CreateAgentDto } from '../dtos/create-agent-dto';

export interface IAgentRepository
  extends CreateRepository<Agent, CreateAgentDto> {
  execute(id: string, parameters: any): Promise<any>;
  register(agentId: string): Promise<void>;
}
