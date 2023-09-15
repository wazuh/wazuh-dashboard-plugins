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
  const [error, setError] = useState('');

  const getAvailableUpdates = (forceUpdate = false) => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await getCore().http.get(`${routes.checkUpdates}`, {
          query: {
            checkAvailableUpdates: forceUpdate,
          },
        });
        setAvailableUpdates(response);
        setIsLoading(false);
      } catch (error: any) {
        setError(error);
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    getAvailableUpdates();
  }, []);

  return { isLoading, availableUpdates, getAvailableUpdates, error };
};
