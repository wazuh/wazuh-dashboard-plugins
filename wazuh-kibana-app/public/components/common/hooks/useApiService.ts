import { useState, useEffect } from 'react';

export function useApiService<T>(service: (params) => Promise<T>, params: (any | undefined)): [boolean, (T | undefined), (string | undefined)] {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  useEffect(() => {
    setLoading(true);
    setError(undefined);
    service(params)
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false)
      })
  }, []);
  return [loading, data, error];
}
