import { useState, useEffect, useCallback } from 'react';
import { fetchCtiRegistrationStatus } from '../../../services/cti-registration-status';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { ISubscriptionResponse } from '../../../services/types';
import { statusCodes } from '../../../../common/constants';

export const useCtiStatus = (deviceFlowNonce = 0) => {
  const [statusCTI, setStatusCTI] = useState<ISubscriptionResponse>({
    status: statusCodes.NOT_FOUND,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [pollingSeed, setPollingSeed] = useState(0);

  const fetchStatus = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
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
      if (!options?.silent) {
        setLoading(false);
        if (
          ctiFlowState.getDeviceCode() &&
          !ctiFlowState.isRegistrationComplete() &&
          !ctiFlowState.isRegistered()
        ) {
          setPollingSeed(s => s + 1);
        }
      }
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (ctiFlowState.isRegistered()) {
      return undefined;
    }
    if (ctiFlowState.isRegistrationComplete()) {
      return undefined;
    }
    if (!ctiFlowState.getDeviceCode()) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const sec = ctiFlowState.getPollIntervalSec();
      timeoutId = setTimeout(async () => {
        if (cancelled) {
          return;
        }
        if (
          !ctiFlowState.getDeviceCode() ||
          ctiFlowState.isRegistrationComplete() ||
          ctiFlowState.isRegistered()
        ) {
          return;
        }
        await fetchStatus({ silent: true });
        if (cancelled) {
          return;
        }
        if (
          !ctiFlowState.getDeviceCode() ||
          ctiFlowState.isRegistrationComplete() ||
          ctiFlowState.isRegistered()
        ) {
          return;
        }
        schedule();
      }, sec * 1000);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [deviceFlowNonce, pollingSeed, fetchStatus]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (
        !ctiFlowState.getDeviceCode() ||
        ctiFlowState.isRegistrationComplete() ||
        ctiFlowState.isRegistered()
      ) {
        return;
      }
      void fetchStatus({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [fetchStatus]);

  return { statusCTI, loading, refetchStatus: fetchStatus };
};
