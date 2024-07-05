export type Agent = {
  agent: {
    id: string;
    name: string;
    version: string;
  };
  host: {
    os: {
      name: string;
      platform: string;
    };
    ip: string;
  };
  wazuh: {};
  groups: string[];
};
