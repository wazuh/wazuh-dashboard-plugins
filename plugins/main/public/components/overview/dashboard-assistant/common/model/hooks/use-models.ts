import { useState, useEffect, useCallback, useMemo } from 'react';
import { getModelsUseCase } from '../get-models';
import { ModelRepository } from '../model-repository';
import { HttpWithProxyClient } from '../../http-client';
import { Model } from '../domain/model';

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
    status: 'active' | 'inactive' | 'error';
    createdAt: string;
    apiUrl: string;
  }>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create use case instance
  const getModels = useMemo(() => {
    const httpClient = new HttpWithProxyClient();
    const modelRepository = new ModelRepository(httpClient);
    return getModelsUseCase(modelRepository);
  }, []);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedModels = await getModels();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getModels]);

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
