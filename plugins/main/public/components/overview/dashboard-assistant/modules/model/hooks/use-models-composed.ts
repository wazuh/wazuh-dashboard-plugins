import { useEffect } from 'react';
import { ModelsComposed } from '../application/dtos/models-composed';
import { UseCases } from '../../../setup';
import { useQuery } from '../../../hooks/use-query';

interface UseModelsComposed {
  models: ModelsComposed[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useModelsComposed(): UseModelsComposed {
  const { data, error, isLoading, fetch } = useQuery<ModelsComposed[]>({
    query() {
      return UseCases.getModelsComposed();
    },
    initialData: [],
    defaultErrorMessage: 'Failed to fetch models data',
  });

  useEffect(() => {
    fetch();
  }, []);

  return {
    models: data,
    isLoading,
    error: error,
    refresh: fetch,
  };
}
