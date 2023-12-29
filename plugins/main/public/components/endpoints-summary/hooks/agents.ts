import { useState, useEffect } from 'react';
import { getTotalAgentsService } from '../services';

export const useGetTotalAgents = () => {
  const [totalAgents, setTotalAgents] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const getTotalAgents = async () => {
    try {
      setIsLoading(true);
      const totalAgents = await getTotalAgentsService();
      setTotalAgents(totalAgents);
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
