import { useState, useEffect } from 'react';
import { UserPreferences } from '../../common/types';
import { getCore } from '../plugin-services';
import { routes } from '../../common/index';

export const useUserPreferences = (userId: string) => {
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getUserPreferences = () => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await getCore().http.get(`${routes.userPreferences}/${userId}`);
        setUserPreferences(response);
        setIsLoading(false);
      } catch (error: any) {
        setError(error);
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    getUserPreferences();
  }, []);

  const updateUserPreferences = async (userPreferences: UserPreferences) => {
    try {
      setIsLoading(true);
      await getCore().http.patch(`${routes.userPreferences}/${userId}`, {
        body: JSON.stringify(userPreferences),
      });
      setUserPreferences(userPreferences);
      setIsLoading(false);
    } catch (error: any) {
      setError(error);
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
