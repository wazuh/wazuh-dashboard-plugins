import { useState, useEffect, useCallback, useMemo } from 'react';
import { GetModelsUseCase } from '../get-models';
import { ModelRepositoryMock } from '../model-repository-mock';
import { Model } from '../domain/model';
import type { ILogger } from '../../installation-manager/domain/types';

// Simple logger implementation for the hook
class SimpleLogger implements ILogger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }
  
  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
  
  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }
  
  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }
}

interface UseModelsReturn {
  models: Model[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getTableData: () => Array<{
    id: string;
    name: string;
    version: string;
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
  const getModelsUseCase = useMemo(() => {
    const logger = new SimpleLogger();
    const modelRepository = new ModelRepositoryMock();
    return new GetModelsUseCase(modelRepository, logger);
  }, []);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedModels = await getModelsUseCase.execute();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getModelsUseCase]);

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
    getTableData
  };
}