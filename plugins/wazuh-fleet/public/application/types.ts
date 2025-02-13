import { Agent } from '../../common/types';

export interface IAgentManagement {
  getAll: () => Promise<Agent[]>;
  getByAgentId: (id: string) => Promise<Agent>;
  delete: (id: string) => Promise<void>;
  upgrade: (id: string) => Promise<void>;
  editGroup: (id: string, groups: string[]) => Promise<void>;
  editName: (id: string) => Promise<void>;
}

export interface AppSetup {
  registerApp: (app: any) => void;
  agentManagement: IAgentManagement;
}
