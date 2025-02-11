export interface Agent {
  agent: {
    id: string;
    key: string;
    last_login: string;
    name: string;
    status: string;
    type: string;
    version: string;
    groups: string[];
    host: {
      architecture: string;
      boot: { id: string };
      cpu: { usage: number };
      disk: {
        read: {
          bytes: number;
        };
        write: {
          bytes: number;
        };
      };
      domain: string;
      geo: {
        city_name: string;
        continent_name: string;
        continent_code: string;
        country_iso_code: string;
        country_name: string;
        location: {
          lat: number;
          lon: number;
        };
        name: string;
        region_name: string;
        region_iso_code: string;
        timezone: string;
        postal_code: string;
      };
      hostname: string;
      id: string;
      ip: string;
      mac: string;
      name: string;
      network: {
        egress: {
          bytes: number;
          packets: number;
        };
        ingress: {
          bytes: number;
          packets: number;
        };
      };
      os: {
        family: string;
        full: string;
        kernel: string;
        name: string;
        platform: string;
        type: string;
        version: string;
      };
      pid_ns_ino: string;
      risk: {
        calculated_level: string;
        calculated_score: number;
        calculated_score_norm: number;
        static_level: string;
        static_score: number;
        static_score_norm: number;
      };
      type: string;
      uptime: number;
    };
  };
}

export interface Group {
  id: string;
  name: string;
  agents: any;
}
