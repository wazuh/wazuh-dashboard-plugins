import { useCallback, useEffect, useState } from 'react';
import { Model } from '../domain/model';
import { ModelStatus } from '../domain/model-status';
import { useCases } from '../../../setup';

interface UseModelsReturn {
  models: Model[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getTableData: () => Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    status: ModelStatus;
    createdAt: string;
    apiUrl: string;
  }>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedModels = await useCases().getModels();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTableData = useCallback(() => {
    return models.map(model => model.toTableFormat());
  }, [models]);

  // Load models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    isLoading,
    error,
    refresh: fetchModels,
    getTableData,
  };
}
