import { useState, useCallback, useMemo } from 'react';
import { deleteModelUseCase } from '../delete-model';
import { ModelRepository } from '../model-repository';
import { HttpClient } from '../../http-client';

export interface UseDeleteModelReturn {
  isDeleting: boolean;
  error: string | null;
  deleteModel: (modelId: string) => Promise<void>;
  reset: () => void;
}

export function useDeleteModel(): UseDeleteModelReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create repository instance
  const repository = useMemo(() => {
    const httpClient = new HttpClient();
    return new ModelRepository(httpClient);
  }, []);

  const deleteModel = useCallback(async (modelId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const deleteUseCase = deleteModelUseCase(repository);
      await deleteUseCase(modelId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [repository]);

  const reset = useCallback(() => {
    setIsDeleting(false);
    setError(null);
  }, []);

  return {
    isDeleting,
    error,
    deleteModel,
    reset,
  };
}