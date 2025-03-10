export interface AgentNetworkTraffic {
  bytes: number;
  packets: number;
}

export interface AgentNetwork {
  egress: AgentNetworkTraffic;
  ingress: AgentNetworkTraffic;
}

export interface AgentGeoPoint {
  lat: number;
  lon: number;
}

export interface AgentGeoLocation {
  city_name: string;
  continent_name: string;
  continent_code: string;
  country_iso_code: string;
  country_name: string;
  location?: AgentGeoPoint;
  name: string;
  region_name: string;
  region_iso_code: string;
  timezone: string;
  postal_code: string;
}

export interface AgentOS {
  family: string;
  full: string;
  kernel: string;
  name: string;
  platform: string;
  type: string;
  version: string;
}

export interface AgentRisk {
  calculated_level: string;
  calculated_score: number;
  calculated_score_norm: number;
  static_level: string;
  static_score: number;
  static_score_norm: number;
}

export interface AgentDiskUsageBytes {
  bytes: number;
}

export interface AgentDisk {
  read: AgentDiskUsageBytes;
  write: AgentDiskUsageBytes;
}

export interface AgentCpu {
  usage: number;
}

export interface AgentBoot {
  id: string;
}

export interface AgentHost {
  architecture: string;
  boot: AgentBoot;
  cpu: AgentCpu;
  disk: AgentDisk;
  domain: string;
  geo?: AgentGeoLocation;
  hostname: string;
  id: string;
  ip: string;
  mac: string;
  name: string;
  network: AgentNetwork;
  os: AgentOS;
  pid_ns_ino: string;
  risk: AgentRisk;
  type: string;
  uptime: number;
}

export interface Agent {
  id: string;
  key: string;
  last_login: string;
  name: string;
  status: string;
  type: string;
  version: string;
  groups: string[];
  host?: AgentHost;
}

export interface AgentWrapper {
  agent: Agent;
}

export interface Group {
  id: string;
  name: string;
  agents: any;
}

export interface IAgentResponse {
  _index: string;
  _id: string;
  _score: number | null;
  _source: Agent;
}
