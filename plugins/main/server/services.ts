/*
 * Lightweight type declarations for health-check tasks.
 * These mirror the runtime context shape provided by the core health-check
 * task runner enough for our compile-time needs. Keep intentionally loose.
 */

export type TaskExecutionContext = 'internal' | 'user';

// The task runner passes an object like { services, context, logger }.
// Some tasks use the de-structured "context" as "ctx" and still access
// ctx.services.*. To keep compatibility, model a permissive type.
export type PluginTaskRunContext = {
  services: any;
  context?: any;
  logger: any;
  request?: any;
  scope?: TaskExecutionContext;
};
