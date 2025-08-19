export interface ModelFieldDefinition {
  name: string;
  id: string;
  version: string;
  status: string;
  createdAt: string;
  agentId?: string;
  agentName?: string;
  inUse?: boolean;
}
