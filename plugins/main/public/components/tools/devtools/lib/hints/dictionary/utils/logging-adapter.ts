import { UI_LOGGER_LEVELS } from '../../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../../react-services/common-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../../../../react-services/error-orchestrator/types';

export function logUiError(context: string, error: any) {
  const options: UIErrorLog = {
    context,
    level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
    severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
    error: {
      error: error as Error,
      message: (error as Error).message || (error as string),
      title: (error as Error).name,
    },
  };
  getErrorOrchestrator().handleError(options);
}
