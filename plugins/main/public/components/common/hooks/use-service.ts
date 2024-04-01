import { useState, useEffect } from 'react';

interface useServiceResponse<T> {
  data: T | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: any;
}

export function useService<T>(
  service: (params?: any | undefined) => Promise<T>,
  params?: any | undefined,
  refresh?: number | undefined,
): useServiceResponse<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(undefined);
  useEffect(() => {
    const handleService = async () => {
      setIsLoading(true);
      try {
        const response = await service(params);
        setData(response);
        setIsSuccess(true);
      } catch (error) {
        setIsError(true);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    handleService();
  }, [refresh]);

  return { data, isLoading, isSuccess, isError, error };
}
