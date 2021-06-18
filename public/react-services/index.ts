import { ErrorOrchestratorService } from './error-orchestrator/error-orchestrator.service';
import { createGetterSetter } from '../utils/create-getter-setter';

export const [getErrorOrchestrator, setErrorOrchestrator] = createGetterSetter<
  ErrorOrchestratorService
>('ErrorOrchestratorService');

export * from './action-agents';
export * from './app-navigate';
export * from './app-state';
export * from './check-daemons-status';
export * from './error-handler';
export * from './filter-authorization-agents';
export * from './generic-request';
export * from './group-handler';
export * from './load-app-config.service';
export * from './pattern-handler';
export * from './reporting';
export * from './saved-objects';
export * from './time-service';
export * from './toast-notifications'
export * from './vis-factory-handler';
export * from './wazuh-config';
export * from './wz-agents';
export * from './wz-api-check';
export * from './wz-authentication';
export * from './wz-csv';
export * from './wz-request';
export * from './wz-security-opendistro';
export * from './wz-security-xpack';
export * from './wz-user-permissions';
