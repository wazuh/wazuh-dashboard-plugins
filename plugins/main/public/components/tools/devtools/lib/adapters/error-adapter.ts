import { ErrorHandler } from '../../../../../react-services';
import { TIMEOUT_STATUS } from '../constants/common';

/**
 * Normalize and stringify API errors so they’re readable in the output editor.
 */
export function parseErrorForOutput(error: any): string {
  if ((error || {}).status === TIMEOUT_STATUS) {
    return 'API is not reachable. Reason: timeout.';
  }

  const parsedError = ErrorHandler.handle(error, '', { silent: true } as any);
  if (typeof parsedError === 'string') {
    return parsedError;
  }
  if (error && error.data && typeof error.data === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
  return 'Empty';
}
