import { useCallback, useEffect } from 'react';
import { useQuery } from '../../../hooks/use-query';
import { UseCases } from '../../../setup';

interface AssistantConfig {
  // Define the structure of the assistant configuration based on your needs
  [key: string]: any;
}

export function useAssistantConfig() {
  const configQuery = useCallback(async (): Promise<AssistantConfig> => {
    try {
      const config = await UseCases.getConfig();
      return config;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch assistant configuration';
      throw new Error(errorMessage);
    }
  }, []);

  const {
    data: config,
    isLoading,
    error,
    fetch: fetchConfig,
    reset,
  } = useQuery<AssistantConfig>({
    query: configQuery,
    initialData: {} as AssistantConfig,
    defaultErrorMessage: 'Failed to load assistant configuration',
  });

  const refetch = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    isLoading,
    error,
    fetchConfig: refetch,
    reset,
  };
}