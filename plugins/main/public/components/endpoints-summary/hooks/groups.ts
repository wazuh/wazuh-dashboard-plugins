import { useState, useEffect } from 'react';
import { getGroupsService } from '../services';

export const useGetGroups = () => {
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const getGroups = async () => {
    try {
      setIsLoading(true);
      const { affected_items } = await getGroupsService({});
      const groups = affected_items.map(item => item.name);
      setGroups(groups);
      setError(undefined);
    } catch (error: any) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getGroups();
  }, []);

  return {
    isLoading,
    groups,
    error,
  };
};
