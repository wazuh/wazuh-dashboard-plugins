import { useState, useEffect } from 'react';
import { WzRequest } from '../../../react-services/wz-request';

export const useGetTotalEndpoints = () => {
  const [totalEndpoints, setTotalEndpoints] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const getTotalEndpoints = async () => {
    try {
      setIsLoading(true);
      const {
        data: {
          data: { total_affected_items },
        },
      } = await WzRequest.apiReq('GET', '/agents', {
        params: { limit: 1, q: 'id!=000' },
      });
      setTotalEndpoints(total_affected_items);
      setError(undefined);
    } catch (error: any) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTotalEndpoints();
  }, []);

  return {
    isLoading,
    totalEndpoints,
    error,
  };
};
