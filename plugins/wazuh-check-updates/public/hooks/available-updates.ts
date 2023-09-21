import { useState, useEffect } from 'react';
import { AvailableUpdates } from '../../common/types';
import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';

export const useAvailableUpdates = () => {
  const defaultAvailableUpdates = {
    mayor: [],
    minor: [],
    patch: [],
  };

  const [availableUpdates, setAvailableUpdates] = useState<AvailableUpdates>(
    defaultAvailableUpdates
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const refreshAvailableUpdates = async (forceUpdate = false, returnError = false) => {
    try {
      setIsLoading(true);
      const response = await getCore().http.get(`${routes.checkUpdates}`, {
        query: {
          checkAvailableUpdates: forceUpdate,
        },
      });
      setAvailableUpdates(response);
      setError(undefined);
    } catch (error: any) {
      setAvailableUpdates(defaultAvailableUpdates);
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

  return { isLoading, availableUpdates, refreshAvailableUpdates, error };
};
