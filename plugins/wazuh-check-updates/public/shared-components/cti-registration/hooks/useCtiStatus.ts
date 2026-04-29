import { useState, useEffect, useCallback } from 'react';
import { fetchCtiRegistrationStatus } from '../../../services/cti-registration-status';
import { ISubscriptionResponse } from '../../../services/types';
import { statusCodes } from '../../../../common/constants';

export const useCtiStatus = () => {
  const [statusCTI, setStatusCTI] = useState<ISubscriptionResponse>({
    status: statusCodes.NOT_FOUND,
    message: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchCtiRegistrationStatus();
      setStatusCTI({
        status: response.statusCode,
        message: response.message,
      });
    } catch (error: unknown) {
      const e = error as { statusCode?: number; message?: string };
      setStatusCTI({
        status: e.statusCode ?? statusCodes.NOT_FOUND,
        message: e.message ?? '',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { statusCTI, loading, refetchStatus: fetchStatus };
};
