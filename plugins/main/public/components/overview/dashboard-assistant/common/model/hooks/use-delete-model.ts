import { useState, useCallback } from 'react';
import { useCases } from '../../../setup';

export interface UseDeleteModelReturn {
  isDeleting: boolean;
  error: string | null;
  deleteModel: (modelId: string) => Promise<void>;
  reset: () => void;
}

export function useDeleteModel(): UseDeleteModelReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteModel = useCallback(async (modelId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      await useCases().deleteModel(modelId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

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
