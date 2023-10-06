import { useState, useEffect } from 'react';
import { ApiAvailableUpdates, AvailableUpdates } from '../../common/types';
import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';

export const useAvailableUpdates = () => {
  const [apisAvailableUpdates, setApisAvailableUpdates] = useState<ApiAvailableUpdates[]>([]);
  const [lastCheck, setLastCheck] = useState<string>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const refreshAvailableUpdates = async (forceUpdate = false, returnError = false) => {
    try {
      setIsLoading(true);
      const response = (await getCore().http.get(routes.checkUpdates, {
        query: {
          checkAvailableUpdates: forceUpdate,
        },
      })) as AvailableUpdates;
      setApisAvailableUpdates(response?.apis_available_updates || []);
      setLastCheck(response?.last_check_date);
      setError(undefined);
    } catch (error: any) {
      setError(error);
      if (returnError) {
        return error instanceof Error
          ? error
          : typeof error === 'string'
          ? new Error(error)
          : new Error('Error trying to get available updates');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailableUpdates();
  }, []);

  return { isLoading, apisAvailableUpdates, refreshAvailableUpdates, error, lastCheck };
};
