import { useState, useEffect } from 'react';
import { AvailableUpdates } from '../../common/types';
import { routes } from '../../common/index';
import { getCore } from '../plugin-services';

export const useAvailableUpdates = () => {
  const [availableUpdates, setAvailableUpdates] = useState<AvailableUpdates>({
    mayor: [],
    minor: [],
    patch: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const refreshAvailableUpdates = (forceUpdate = false) => {
    (async () => {
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
        setError(error);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    refreshAvailableUpdates();
  }, []);

  return { isLoading, availableUpdates, refreshAvailableUpdates, error };
};
