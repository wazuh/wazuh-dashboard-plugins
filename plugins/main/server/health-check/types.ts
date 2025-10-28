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
