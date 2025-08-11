import { useCallback, useEffect, useState } from 'react';
import { Model } from '../domain/entities/model';
import { UseCases } from '../../../setup';
import { ModelFieldDefinition } from '../../../components/types';

interface UseModelsReturn {
  models: Model[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mapModelsToTableData: () => Array<ModelFieldDefinition>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedModels = await UseCases.getModels();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const mapModelsToTableData = useCallback(() => {
    return models.map(model => {
      return {
        name: model.name,
        id: model.id,
        version: model.version,
        status: model.status,
        createdAt: model.created_at,
      };
    });
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
    mapModelsToTableData,
  };
}
