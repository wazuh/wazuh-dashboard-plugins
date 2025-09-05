export interface APIInfoDefault {
  default: APIInfo[];
}

export interface APIInfo {
  method: string;
  endpoints: Endpoint[];
}

export interface Endpoint {
  name: string;
  documentation: string;
  description: string;
  summary: string;
  tags: string[];
  query?: Query[];
  args?: Arg[];
  body?: Body[];
}

export interface Arg {
  name: string;
  description?: string;
  required: boolean;
  schema: ItemsClass;
}

export interface ItemsClass {
  type: SchemaType;
  minLength?: number;
  description?: string;
  format?: ItemsFormat;
  enum?: string[];
  minimum?: number;
}

enum ItemsFormat {
  Alphanumeric = 'alphanumeric',
  CdbFilenamePath = 'cdb_filename_path',
  GroupNames = 'group_names',
  GroupNamesOrAll = 'group_names_or_all',
  Int32 = 'int32',
  Names = 'names',
  Numbers = 'numbers',
  NumbersOrAll = 'numbers_or_all',
  XMLFilename = 'xml_filename',
  XMLFilenamePath = 'xml_filename_path',
}

enum SchemaType {
  Array = 'array',
  Boolean = 'boolean',
  Integer = 'integer',
  Number = 'number',
  String = 'string',
}

export interface Body {
  type: AlertType;
  properties: BodyProperties;
  required?: string[];
  minProperties?: number;
  example?: Example;
}

export interface Example {
  group_id: string;
}

export interface BodyProperties {
  arguments?: Arguments;
  command?: Command;
  alert?: Alert;
  token?: Event;
  log_format?: Event;
  location?: Event;
  event?: Event;
  auth_token_exp_timeout?: AuthTokenExpTimeout;
  rbac_mode?: RbacMode;
  name?: Command;
  policy?: Policy;
  rule?: Event;
  password?: Password;
  ip?: Command;
  id?: Command;
  key?: Command;
  force?: Force;
  events?: Arguments;
  group_id?: Command;
  username?: Command;
}

export interface Alert {
  type: AlertType;
  properties: AlertProperties;
}

export interface AlertProperties {
  data: Event;
}

export interface Event {
  description: string;
  type: string;
}

enum AlertType {
  Object = 'object',
}

export interface Arguments {
  description: string;
  type: SchemaType;
  items: Items;
}

export interface Items {
  type: SchemaType;
}

export interface AuthTokenExpTimeout {
  description: string;
  type: SchemaType;
  format: ItemsFormat;
  minimum: number;
  example: number;
}

export interface Command {
  description?: string;
  type: SchemaType;
  format: string;
  default?: string;
  maxLength?: number;
  minLength?: number;
}

export interface Force {
  type: AlertType;
  description: string;
  properties: ForceProperties;
}

export interface ForceProperties {
  enabled: Enabled;
  disconnected_time: DisconnectedTime;
  after_registration_time: Command;
}

export interface DisconnectedTime {
  type: AlertType;
  properties: DisconnectedTimeProperties;
}

export interface DisconnectedTimeProperties {
  enabled: Enabled;
  value: Command;
}

export interface Enabled {
  type: SchemaType;
  default: boolean;
  description: string;
}

export interface Password {
  type: SchemaType;
  format: string;
}

export interface Policy {
  description: string;
  type: AlertType;
  properties: PolicyProperties;
  required: string[];
}

export interface PolicyProperties {
  actions: Arguments;
  resources: Arguments;
  effect: Event;
}

export interface RbacMode {
  description: string;
  type: SchemaType;
  enum: string[];
  example: string;
}

export interface Query {
  name: string;
  description: string;
  schema: QuerySchema;
  required?: boolean;
}

export interface QuerySchema {
  type: SchemaType;
  default?: boolean | number | string;
  items?: ItemsClass;
  description?: string;
  format?: PurpleFormat;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxLength?: number;
}

enum PurpleFormat {
  Alphanumeric = 'alphanumeric',
  AlphanumericSymbols = 'alphanumeric_symbols',
  Date = 'date',
  Float = 'float',
  GetDirnamesPath = 'get_dirnames_path',
  GroupNames = 'group_names',
  Hash = 'hash',
  Int32 = 'int32',
  Int64 = 'int64',
  Names = 'names',
  Numbers = 'numbers',
  Path = 'path',
  Paths = 'paths',
  Range = 'range',
  Search = 'search',
  Sort = 'sort',
  SymbolsAlphanumericParam = 'symbols_alphanumeric_param',
  Timeframe = 'timeframe',
  WazuhVersion = 'wazuh_version',
  WpkPath = 'wpk_path',
}
