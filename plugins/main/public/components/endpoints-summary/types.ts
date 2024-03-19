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
    uname: string;
    version: string;
  };
  lastKeepAlive: Date;
  dateAdd: Date;
  configSum: string;
  manager: string;
  registerIP: string;
  status: string;
  mergedSum: string;
  version: string;
  node_name: string;
  group_config_status: string;
  status_code: number;
};

export type Group = {
  name: string;
  count: number;
};

export type ResponseUpgradeAgents = {
  agent: string;
  task_id: number;
};
