import { useState, useCallback } from 'react';
import { testModelConnectionUseCase } from '../test-model-connection';
import { ModelRepository } from '../model-repository';
import { HttpWithProxyClient } from '../../http-client';
import { ModelPredictResponse } from '../domain/types';

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

  const testModel = useCallback(async (modelId: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const httpClient = new HttpWithProxyClient();
      const modelRepository = new ModelRepository(httpClient);
      const testModelConnection = testModelConnectionUseCase(modelRepository);

      const result = await testModelConnection({ modelId });
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
