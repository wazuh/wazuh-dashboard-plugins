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
  upgrade: (id: string) => Promise<void>;
  editGroup: (id: string, groups: string | string[]) => Promise<void>;
  editName: (id: string, newName: string) => Promise<void>;
  addOrRemoveGroupsToAgents: (
    id: string[],
    group: string | string[],
    addOrRemove: 'add' | 'remove',
  ) => Promise<void>;
}

export interface IAgentManagementProps {
  queryManagerService: any;
  getIndexPatternId: () => string;
  deleteAgent: (documentId: string | string[]) => Promise<any>;
  editAgentGroups: (
    agentId: string | string[],
    groups: string | string[],
  ) => Promise<any>;
  editAgentName: (agentId: string, newName: string) => Promise<any>;
  addOrRemoveGroups: (
    agentId: string[],
    groups: string | string[],
    addOrRemove: 'add' | 'remove',
  ) => Promise<any>;
}

export interface AppSetup {
  registerApp: (app: any) => void;
  agentManagement: IAgentManagement;
  enrollmentAgentManagement: {
    getServerAddress: () => Promise<string>;
    setServerAddress: (url: string) => Promise<string>;
  };
}
