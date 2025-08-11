import { useCallback, useEffect } from 'react';
import { Model } from '../domain/entities/model';
import { UseCases } from '../../../setup';
import { ModelFieldDefinition } from '../../../components/types';
import { useQuery } from '../../../hooks/use-query';

interface UseModelsReturn {
  models: Model[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mapModelsToTableData: () => Array<ModelFieldDefinition>;
}

export function useModels(): UseModelsReturn {
  const {
    data: models,
    error,
    isLoading,
    fetch,
  } = useQuery<Model[]>({
    query() {
      return UseCases.getModels();
    },
    initialData: [],
    defaultErrorMessage: 'Failed to fetch models',
  });

  useEffect(() => {
    fetch();
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

  return {
    models,
    isLoading,
    error,
    refresh: fetch,
    mapModelsToTableData,
  };
}
