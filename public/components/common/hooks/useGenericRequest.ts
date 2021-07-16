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

export function useGenericRequest(method, path, params, formatFunction) {
  const [items, setItems] = useState({});
  const [isLoading, setisLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect( () => {
    try{
      setisLoading(true);
      const fetchData = async() => {
          const response = await GenericRequest.request(method, path, params);
          setItems(response);
          setisLoading(false);
        }
        fetchData();
    } catch(error) {
      setError(error);
      setisLoading(false);
      const options: UIErrorLog = {
        context: `${useGenericRequest.name}.fetchData`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }, [params]);

  return {isLoading, data: formatFunction(items), error};
}
