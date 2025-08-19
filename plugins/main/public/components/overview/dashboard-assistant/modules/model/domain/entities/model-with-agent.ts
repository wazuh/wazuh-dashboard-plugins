import { Model } from './model';

export interface ModelWithAgent extends Model {
  agentId?: string;
  agentName?: string;
}
