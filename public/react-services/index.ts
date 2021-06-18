import { ErrorOrchestratorService } from './error-orchestrator/error-orchestrator.service';
import { createGetterSetter } from '../utils/create-getter-setter';

export { GenericRequest } from './generic-request';
export { WzRequest } from './wz-request';
export { ErrorHandler } from './error-handler';
export { formatUIDate } from './time-service';

export const [getErrorOrchestrator, setErrorOrchestrator] = createGetterSetter<
  ErrorOrchestratorService
>('ErrorOrchestratorService');

