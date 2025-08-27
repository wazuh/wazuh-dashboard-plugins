import { useEffect, useState } from 'react';
import { GenericRequest } from '../../../react-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { Settings } from '../settings';

export const useAboutData = () => {
  const [appInfo, setAppInfo] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await GenericRequest.request('GET', '/api/setup');
        const response = data.data.data;
        setAppInfo(response['app-version'] as string);
      } catch (error) {
        setError(true);
        const options = {
          context: `${Settings.name}.getAppInfo`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { appInfo, loading, error };
};
