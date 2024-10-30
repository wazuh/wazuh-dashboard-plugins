import { useState, useEffect } from 'react';
import { GenericRequest } from '../../../react-services/generic-request';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';

interface UseGenericRequestProps {
  method: string;
  path: string;
  params?: any;
  resolveData?: (data: any) => any;
}

export function useGenericRequest({
  method,
  path,
  params = {},
  resolveData = response => response,
}: UseGenericRequestProps) {
  const [response, setResponse] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    try {
      setIsLoading(true);
      const fetchData = async () => {
        const response = await GenericRequest.request<any>(
          method,
          path,
          params,
        );
        setResponse(response);
      };
      fetchData();
    } catch (error) {
      setError(error as Error);
      const options: UIErrorLog = {
        context: `${useGenericRequest.name}.fetchData`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
        error: {
          error: error,
          message: (error as Error).message || (error as string),
          title: (error as Error).name || (error as string),
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params), path, method]);

  return {
    isLoading,
    data: resolveData(response),
    error,
  };
}
