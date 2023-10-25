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

      const checkUpdates = sessionStorage.getItem('checkUpdates');
      const alreadyCheckUpdates = checkUpdates === 'executed';

      const response = await getAvailableUpdates(forceUpdate || !alreadyCheckUpdates);

      setApisAvailableUpdates(response?.apis_available_updates || []);
      setLastCheck(response?.last_check_date);
      setError(undefined);

      if (!alreadyCheckUpdates) {
        sessionStorage.setItem('checkUpdates', 'executed');
      }
    } catch (error: any) {
      if (returnError) {
        return error instanceof Error
          ? error
          : typeof error === 'string'
          ? new Error(error)
          : new Error('Error trying to get available updates');
      } else {
        setError(error);
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

export const getAvailableUpdates = async (forceUpdate = false): Promise<AvailableUpdates> => {
  return await getCore().http.get(routes.checkUpdates, {
    query: {
      checkAvailableUpdates: forceUpdate,
    },
  });
};
