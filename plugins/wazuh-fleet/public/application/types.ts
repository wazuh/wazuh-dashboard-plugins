export interface IAgentManagement {
  delete: (id: string) => Promise<void>;
  upgrade: (id: string) => Promise<void>;
  editGroup: (id: string) => Promise<void>;
  editName: (id: string) => Promise<void>;
}

export interface AppSetup {
  registerApp: (app: any) => void;
  agentManagement: IAgentManagement;
}
