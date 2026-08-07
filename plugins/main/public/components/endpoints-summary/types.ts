export type Agent = {
  id: string;
  name: string;
  ip: string;
  group: string[];
  os: {
    arch: string;
    codename: string;
    major: string;
    minor: string;
    name: string;
    platform: string;
    version: string;
    type: string;
  };
  lastKeepAlive: Date;
  dateAdd: Date;
  configSum: string;
  manager: string;
  registerIP: string;
  status: string;
  version: string;
  node_name: string;
  status_code: number;
};

export type Group = {
  name: string;
  count: number;
};

export type ResponseUpgradeAgents = string;

export type ResponseRemoveAgent = string;

export type AgentInfoMinimal = {
  id: string;
  name: string;
};
