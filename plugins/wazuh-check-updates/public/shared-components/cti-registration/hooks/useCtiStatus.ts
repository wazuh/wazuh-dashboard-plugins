import { useState, useEffect, useRef, useCallback } from 'react';
import { CtiStatus } from '../types';
import { getApiInfo } from '../../../services/get-api-info';

export const useCtiStatus = () => {
  const [isActive, setIsActive] = useState<CtiStatus>(CtiStatus.PENDING);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<CtiStatus | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    // Avoid multiple intervals
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await getApiInfo();
        const statusRegistration =
          response.affected_items?.[0]?.wazuh_cti_auth?.status ||
          CtiStatus.PENDING;

        // Only update isActive if the status changed
        if (previousStatusRef.current !== statusRegistration) {
          setIsActive(statusRegistration);
          previousStatusRef.current = statusRegistration;
        }

        // If the status is no longer polling, stop polling
        if (statusRegistration !== CtiStatus.POLLING) {
          stopPolling();
        }
      } catch (error) {
        console.error('Error during polling:', error);
        setIsActive(CtiStatus.DENIED);
        stopPolling();
      }
    }, 5000);
  }, [stopPolling]);

  const checkCtiStatus = useCallback(async () => {
    try {
      const response = await getApiInfo();
      const statusRegistration =
        response.affected_items?.[0]?.wazuh_cti_auth?.status ||
        CtiStatus.PENDING;

      // Only update isActive if the status changed
      if (previousStatusRef.current !== statusRegistration) {
        setIsActive(statusRegistration);
        previousStatusRef.current = statusRegistration;
      }

      // If PENDING, start polling
      if (statusRegistration === CtiStatus.POLLING) {
        startPolling();
      } else {
        // If not PENDING, stop polling
        setIsActive;
        stopPolling();
      }
    } catch (error) {
      console.error('Error checking CTI status:', error);
      setIsActive(CtiStatus.DENIED);
      stopPolling();
    }
  }, [startPolling, stopPolling]);

  useEffect(() => {
    checkCtiStatus();
    return () => {
      // Remove polling when component unmounts
      stopPolling();
    };
  }, [checkCtiStatus, stopPolling]);

  return {
    isActive,
    checkCtiStatus,
    startPolling,
    stopPolling,
  };
};
