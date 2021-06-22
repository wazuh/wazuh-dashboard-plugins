import { ErrorOrchestratorService } from './error-orchestrator/error-orchestrator.service';
import { createGetterSetter } from '../utils/create-getter-setter';

export const [getErrorOrchestrator, setErrorOrchestrator] = createGetterSetter<
  ErrorOrchestratorService
>('ErrorOrchestratorService');
