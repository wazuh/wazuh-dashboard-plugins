import { IAgentResponse } from '../../common/types';

export interface ISearch {
  total: number;
  max_score: number | null;
  hits: IAgentResponse[];
}

export interface IGetAllParams {
  filter?: any[];
  query?: string;
  pagination?: {
    pageSize: number;
    pageIndex: number;
  };
  sort?: {
    field: string;
    direction: string;
  };
}

export interface IAgentManagement {
  getAll: (params: IGetAllParams) => Promise<ISearch>;
  getByAgentId: (id: string) => Promise<ISearch>;
  delete: (id: string | string[]) => Promise<void>;
  upgrade: (id: string[]) => Promise<void>;
  removeGroups: (id: string, groups: string | string[]) => Promise<void>;
  editName: (id: string, newName: string) => Promise<void>;
  addGroups: (id: string, group: string | string[]) => Promise<void>;
}

export interface IAgentManagementProps {
  queryManagerService: any;
  getIndexPatternId: () => string;
  deleteAgent: (documentId: string | string[]) => Promise<any>;
  removeGroups: (agentId: string, groups: string | string[]) => Promise<any>;
  editAgentName: (agentId: string, newName: string) => Promise<any>;
  addGroups: (agentId: string, groups: string | string[]) => Promise<any>;
  upgradeAgent: (agentIds: string[]) => Promise<any>;
}

export interface AppSetup {
  registerApp: (app: any) => void;
  agentManagement: IAgentManagement;
  enrollmentAgentManagement: {
    serverURLSettingName: string;
    getServerURL: () => Promise<string>;
    setServerURL: (url: string) => Promise<string>;
    commsURLSettingName: string;
    getCommunicationsURL: () => Promise<string>;
    setCommunicationsURL: (url: string) => Promise<string>;
  };
}

export interface ResponseUpgradeAgents {
  agent: string;
  task_id: number;
}
