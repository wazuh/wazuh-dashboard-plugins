import { UIErrorLog, UILogLevel, UIErrorSeverity, UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
/**
   * Build and return a new error options object, based on the actual error
   * and the context
   * @param error raised error
   * @param context context of the error
   * @returns a dictionary with the error details for the ErrorOrchestator
   */
 export function getErrorOptions(error: unknown, context: string): UIErrorLog {
    return {
      context: context,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
      error: {
        error: error,
        message: error?.message || error,
        title: error?.name,
      },
    };
  }