import { useEffect, useState } from 'react';
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

  const [models, setModels] = useState<ModelsComposed[]>([]);

  useEffect(() => {
    setModels(data);
    console.log('models changes', data);
  }, [data]);

  useEffect(() => {
    fetch();
  }, []);

  return {
    models,
    isLoading,
    error: error,
    refresh: async () => {
      await fetch();
    },
  };
}
