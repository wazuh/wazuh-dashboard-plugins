import { useState, useEffect } from 'react';
import { getAgentsService } from '../services';
import { Agent } from '../types';

export const useGetTotalAgents = (filters?: any) => {
  const [totalAgents, setTotalAgents] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const getTotalAgents = async () => {
    try {
      setIsLoading(true);
      const { total_affected_items } = await getAgentsService(filters, 1, 0);
      setTotalAgents(total_affected_items);
      setError(undefined);
    } catch (error: any) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTotalAgents();
  }, []);

  return {
    isLoading,
    totalAgents,
    error,
  };
};
