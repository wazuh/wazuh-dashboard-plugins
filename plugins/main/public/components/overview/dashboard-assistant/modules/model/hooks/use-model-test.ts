import { useState, useCallback } from 'react';
import { ModelPredictResponse } from '../domain/types';
import { UseCases } from '../../../setup';
import { useQuery } from '../../../hooks/use-query';

interface UseModelTestReturn {
  isLoading: boolean;
  response: ModelPredictResponse | null;
  error: string | null;
  testModel: (modelId: string) => Promise<void>;
  reset: () => void;
}

export function useModelTest(): UseModelTestReturn {
  const {
    data: response,
    error,
    isLoading,
    fetch,
    reset,
  } = useQuery<ModelPredictResponse | null>({
    query(model_id: string) {
      return UseCases.testModelConnection(model_id);
    },
    initialData: null,
    defaultErrorMessage: 'Failed to test model connection',
  });

  return {
    isLoading,
    response,
    error,
    testModel: fetch,
    reset,
  };
}
