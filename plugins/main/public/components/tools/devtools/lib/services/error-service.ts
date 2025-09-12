import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';

export interface ErrorInfo {
  context: string;
  title?: string;
  message?: string | Error;
  error?: any;
  level?: UILogLevel;
  severity?: UIErrorSeverity;
}

/**
 * Thin wrapper over Error Orchestrator to unify logging.
 */
export class ErrorService {
  log(options: ErrorInfo) {
    const payload: UIErrorLog = {
      context: options.context,
      level: (options.level || UI_LOGGER_LEVELS.ERROR) as UILogLevel,
      severity: (options.severity || UI_ERROR_SEVERITIES.UI) as UIErrorSeverity,
      error: {
        error: options.error,
        message:
          (typeof options.message === 'string'
            ? options.message
            : (options.message as Error)?.message) ||
          (options.error as any)?.message ||
          options.error,
        title: options.title || (options.error as any)?.name,
      },
    };

    getErrorOrchestrator().handleError(payload);
  }
}
