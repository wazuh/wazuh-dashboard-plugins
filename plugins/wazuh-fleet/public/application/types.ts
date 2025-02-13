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
  editGroup: (id: string, groups: string[]) => Promise<void>;
  editName: (id: string) => Promise<void>;
}

export interface AppSetup {
  registerApp: (app: any) => void;
  agentManagement: IAgentManagement;
}
