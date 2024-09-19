export interface Rule {
  id: string;
  level: number;
  description: string;
  groups: string[];
  firedtimes?: number;
  mail?: boolean;
  gdpr?: string[];
  pci_dss?: string[];
  tsc?: string[];
  hipaa?: string[];
  nist_800_53?: string[];
  nist_800_83?: string[];
  gpg13?: string[];
  pci?: string[];
  frequency?: number;
  info?: string;
}

export interface Agent {
  id: string;
  name: string;
  ip: string;
}

export interface Manager {
  name: string;
}

export interface Cluster {
  name: string;
  node: string;
}

export interface Decoder {
  parent?: string;
  name: string;
}

export interface Input {
  type: string;
}

export interface Location {
  lat: number;
  lon: number;
}

export interface Field {
  timestamp: string;
}

export type GeoLocation = {
  country_name: string;
  location: Location;
  region_name: string;
  city_name: string;
};

export interface Process {
  name: string;
  id: number;
  ppid: number;
}

export interface User {
  name: string;
  id: number;
}

export interface Audit {
  process: Process;
  effective_user: User;
  user: User;
  group: User;
}

export interface SysCheck {
  event: string;
  path: string;
  uname_after: string;
  gname_after: string;
  mtime_before: Date;
  mtime_after: Date;
  size_after: number;
  uid_after: string;
  gid_after: string;
  perm_after: string;
  inode_before: number;
  inode_after: number;
  sha1_after: string;
  changed_attributes: string[];
  md5_after: string;
  sha256_after: string;
  tags: string[];
  audit: Audit;
}

type DataKeys =
  | 'integration'
  | 'aws'
  | 'office365'
  | 'gcp'
  | 'audit'
  | 'oscap'
  | 'title'
  | 'file'
  | 'virustotal'
  | 'vulnerability'
  | 'osquery'
  | 'srcip'
  | 'srcuser'
  | 'srcport'
  | 'win'
  | 'dstuser'
  | 'uid'
  | 'euid'
  | 'tty'
  | 'github'
  | 'system_name'
  | 'id'
  | 'protocol'
  | 'url'
  | 'extra_data'
  | 'type'
  | 'status'
  | 'YARA'
  | 'cis';

export type Data = Partial<Record<DataKeys, any>>;

export type PreDecoder = {
  program_name: string;
  timestamp: string;
  hostname?: string;
};

export interface Alert {
  id: string;
  agent: Agent;
  cluster: Cluster;
  data: Data;
  decoder: Decoder;
  location: string;
  manager: Manager;
  rule: Rule;
  timestamp: string;
  predecoder?: PreDecoder;
  fields?: Field;
  full_log?: string;
  GeoLocation?: GeoLocation;
  input?: Input;
  previous_output?: string;
  syscheck?: Partial<SysCheck>;
}

export interface SampleAlert extends Alert {
  '@timestamp': string;
  '@sampledata': true;
}

/* params to configure the alert */
export type Params = {
  manager: Manager;
  cluster: Cluster;
  /* if true, set aws fields */
  aws: boolean;
  /* if true, set office fields */
  office: boolean;
  /* if true, set GCP fields */
  gcp: boolean;
  /* if true, set System Auditing fields */
  audit: boolean;
  /* if true, set CIS-CAT fields */
  ciscat: boolean;
  /* if true, set Docker fields */
  docker: boolean;
  /* if true, set Mitre att&ck fields */
  mitre: boolean;
  /* if true, set OpenSCAP fields */
  openscap: boolean;
  /* if true, set Policy monitoring fields */
  rootcheck: boolean;
  /* if true, set integrity monitoring fields (IMF) */
  syscheck: boolean;
  /* if true, set VirusTotal fields */
  virustotal: boolean;
  /* if true, set vulnerabilities fields */
  vulnerabilities: boolean;
  /* if true, set Osquery fields */
  osquery: boolean;
  /* if true, set pci_dss fields */
  pci_dss: boolean;
  /* if true, set gdpr fields */
  gdpr: boolean;
  /* if true, set gpg13 fields */
  gpg13: boolean;
  /* if true, set hipaa fields */
  hipaa: boolean;
  /* if true, set nist_800_83 fields */
  nist_800_83: boolean;
  /* if true, set Regulatory compliance fields */
  regulatory_compliance: boolean;
  /* if true, set authentication fields */
  authentication: boolean;
  /* if true, set ssh fields */
  ssh: boolean;
  /* if true, set apache fields */
  apache: boolean;
  /* if true, set web fields */
  web: boolean;
  /* if true, set windows fields */
  github: boolean;
  /* if true, set YARA fields */
  yara: boolean;
  /* if true, set windows fields */
  windows: {
    service_control_manager: boolean;
  };
  random_probability_regulatory_compliance: number;
};
