import { useCallback } from 'react';
import { Model } from '../domain/entities/model';
import { UseCases } from '../../../setup';
import { ModelFieldDefinition } from '../../../components/types';
import { useFetchData } from '../../../hooks/use-fetch-data';

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
    refreshData,
  } = useFetchData<Model[]>({
    fetch() {
      return UseCases.getModels();
    },
    initialData: [],
  });

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
    refresh: refreshData,
    mapModelsToTableData,
  };
}
