import { useEffect, useState } from 'react';
import WazuhError from '../../error-factory/errors/WazuhError';
import { ErrorHandler } from '../error-handler';

/**
 *
 * @param callback
 * @returns
 */
export const useErrorHandler = (callback: Function) => {
  const [res, setRes] = useState(null);
  const [error, setError] = useState<Error|WazuhError|null>(null);
  useEffect(() => {
    (async () => {
      try {
        let res = await callback();
        setRes(res);
        setError(null);
      } catch (error) {
        if (error instanceof Error) {
          error = ErrorHandler.handleError(error);
        }
        setRes(null);
        setError(error as Error | WazuhError);
      }
    })()
  }, [])
  
  return [res, error];
};
