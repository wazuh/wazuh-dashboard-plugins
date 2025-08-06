import { Agent } from '../../../domain/entities/agent';
import { AppType } from '../../../domain/enums/app-type';

export interface AgentOpenSearchRequestDto extends Omit<Agent, 'id'> {
  memory: {
    type: 'conversation_index';
  };
  app_type: AppType;
}
