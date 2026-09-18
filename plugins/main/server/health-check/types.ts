import type { Logger } from 'opensearch_dashboards/server';

/**
 * Mirror of the platform health check result contract. `Symbol.for` resolves to
 * the same registry symbol the platform reads, so no import is needed.
 */
export const TASK_RESULT: unique symbol = Symbol.for('healthcheck.taskResult');

export type TaskResult<T = unknown> = { readonly [TASK_RESULT]: true } & (
  | { status: 'ok'; data?: T }
  | { status: 'warning'; message: string; data?: T }
  | { status: 'error'; message: string; data?: T }
);

export const taskResult = {
  ok: <T = unknown>(data?: T): TaskResult<T> => ({
    [TASK_RESULT]: true,
    status: 'ok',
    data,
  }),
  warning: <T = unknown>(message: string, data?: T): TaskResult<T> => ({
    [TASK_RESULT]: true,
    status: 'warning',
    message,
    data,
  }),
  error: <T = unknown>(message: string, data?: T): TaskResult<T> => ({
    [TASK_RESULT]: true,
    status: 'error',
    message,
    data,
  }),
};

export type TaskExecutionContext =
  | 'internal'
  | 'internal-initial'
  | 'internal-scheduled'
  | 'user';

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
