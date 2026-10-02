import { ErrorHandler } from '../../../../../react-services';
import { TIMEOUT_STATUS } from '../constants/common';
import { MESSAGES } from '../constants/messages';

/**
 * Normalize and stringify API errors so they’re readable in the output editor.
 */
export function parseErrorForOutput(error: any): string {
  if ((error || {}).status === TIMEOUT_STATUS) {
    return MESSAGES.API_TIMEOUT;
  }

  const parsedError = ErrorHandler.handle(error, '', { silent: true } as any);
  if (typeof parsedError === 'string') {
    return parsedError;
  }
  if (error && error.data && typeof error.data === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return MESSAGES.UNKNOWN_ERROR;
    }
  }
  return MESSAGES.EMPTY_ERROR;
}
