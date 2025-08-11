import { useCallback, useState } from 'react';

interface UseFetchDataProps<T> {
  query: (params?: any) => Promise<T>;
  initialData: T;
  defaultErrorMessage: string;
}

interface UseFetchDataReturn<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  fetch: (params?: any) => Promise<void>;
  reset: () => void;
}

export function useQuery<T>({
  query,
  initialData,
  defaultErrorMessage,
}: UseFetchDataProps<T>): UseFetchDataReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(
    async (params: any) => {
      setIsLoading(true);
      setData(initialData);
      setError(null);

      try {
        const data = await query(params);
        setData(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : defaultErrorMessage;
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [query, initialData],
  );

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    fetch: executeQuery,
    reset,
  };
}
