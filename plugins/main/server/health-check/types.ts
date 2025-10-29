import type { Logger } from 'opensearch_dashboards/server';

export type TaskExecutionContext = 'internal' | 'user';

export type InitializationTaskContext = TaskExecutionContext;

export interface HealthCheckTaskContext {
  services: Record<string, any>;
  logger: Logger;
  request?: any;
  scope?: TaskExecutionContext;
  configuration?: {
    get: (key: string) => Promise<any>;
  };
  getIndexPatternID?: (ctx: HealthCheckTaskContext) => Promise<string>;
  [key: string]: any;
}

export interface PluginTaskRunContext extends HealthCheckTaskContext {
  context: HealthCheckTaskContext;
}

export type InitializationTaskRunContext = PluginTaskRunContext;

export interface NotificationConfigsOpenSearchResponse {
  start_index: number;
  total_hits: number;
  total_hit_relation: string;
  config_list: ConfigList[];
}

export interface ConfigList {
  config_id: string;
  last_updated_time_ms: number;
  created_time_ms: number;
  config: Config;
}

export interface Config {
  name: string;
  description: string;
  config_type: string;
  is_enabled: boolean;
  slack?: Chime;
  chime?: Chime;
}

export interface Chime {
  url: string;
}
