import { useState, useEffect, useRef, useCallback } from 'react';
import { CtiStatus } from '../types';
import { getApiInfo } from '../../../services/get-api-info';

export const useCtiStatus = () => {
  const [isActive, setIsActive] = useState<CtiStatus>(CtiStatus.INACTIVE);
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
          response.affected_items[0]?.registration?.status ||
          CtiStatus.INACTIVE;

        // Only update isActive if the status changed
        if (previousStatusRef.current !== statusRegistration) {
          setIsActive(statusRegistration);
          previousStatusRef.current = statusRegistration;
        }

        // If the status is no longer PENDING, stop polling
        if (statusRegistration !== CtiStatus.PENDING) {
          stopPolling();
        }
      } catch (error) {
        console.error('Error during polling:', error);
        setIsActive(CtiStatus.ERROR);
        stopPolling();
      }
    }, 5000);
  }, [stopPolling]);

  const checkCtiStatus = useCallback(async () => {
    try {
      const response = await getApiInfo();
      const statusRegistration =
        response.affected_items[0]?.registration?.status || CtiStatus.INACTIVE;

      // Only update isActive if the status changed
      if (previousStatusRef.current !== statusRegistration) {
        setIsActive(statusRegistration);
        previousStatusRef.current = statusRegistration;
      }

      // If PENDING, start polling
      if (statusRegistration === CtiStatus.PENDING) {
        startPolling();
      } else {
        // If not PENDING, stop polling
        stopPolling();
      }
    } catch (error) {
      console.error('Error checking CTI status:', error);
      setIsActive(CtiStatus.ERROR);
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
