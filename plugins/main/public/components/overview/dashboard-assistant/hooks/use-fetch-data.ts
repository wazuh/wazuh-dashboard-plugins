import { useCallback, useEffect, useState } from 'react';

interface UseFetchDataProps<T> {
  fetch: () => Promise<T>;
  initialData: T;
}

interface UseFetchDataReturn<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useFetchData<T>({
  fetch,
  initialData,
}: UseFetchDataProps<T>): UseFetchDataReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetch();
      setData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData,
  };
}
