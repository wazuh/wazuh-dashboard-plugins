import { useState, useCallback } from 'react';
import { ModelPredictResponse } from '../domain/types';
import { UseCases } from '../../../setup';

interface UseModelTestReturn {
  isLoading: boolean;
  response: ModelPredictResponse | null;
  error: string | null;
  testModel: (modelId: string) => Promise<void>;
  reset: () => void;
}

export function useModelTest(): UseModelTestReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ModelPredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testModel = useCallback(async (model_id: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await UseCases.testModelConnection(model_id);
      setResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setResponse(null);
    setError(null);
  }, []);

  return {
    isLoading,
    response,
    error,
    testModel,
    reset,
  };
}
