import { useState, useEffect } from 'react';
import { UserPreferences } from '../../common/types';
import { getCore } from '../plugin-services';
import { routes } from '../../common/constants';

export const useUserPreferences = () => {
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const refreshUserPreferences = () => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await getCore().http.get(routes.userPreferences);
        setUserPreferences(response);
        setError(undefined);
      } catch (error: any) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    refreshUserPreferences();
  }, []);

  const updateUserPreferences = async (userPreferences: UserPreferences) => {
    try {
      setIsLoading(true);
      await getCore().http.patch(routes.userPreferences, {
        body: JSON.stringify(userPreferences),
      });
      setUserPreferences(userPreferences);
    } catch (error: any) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    userPreferences,
    updateUserPreferences,
    error,
  };
};
