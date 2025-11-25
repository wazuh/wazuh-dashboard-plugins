import { useState, useEffect, useRef, useCallback } from 'react';
import { CtiDetails, CtiStatus } from '../types';
import { getStatusSubscription } from '../../../services/subscription';
import { IWazuhCtiDetails } from '../../../services/types';

export const useCtiStatus = () => {
  const [statusCTI, setStatusCTI] = useState<IWazuhCtiDetails>({
    status: CtiStatus.PENDING,
    details: CtiDetails.PENDING,
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<IWazuhCtiDetails | null>(null);

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
        const response = await getStatusSubscription();
        const statusRegistration = response.affected_items?.[0]
          ?.wazuh_cti_auth || {
          status: CtiStatus.PENDING,
          details: CtiDetails.PENDING,
        };

        // Only update statusCTI if the status changed
        if (previousStatusRef.current?.status !== statusRegistration.status) {
          setStatusCTI(statusRegistration);
          previousStatusRef.current = statusRegistration;
        }

        // If the status is no longer polling, stop polling
        if (statusRegistration.status !== CtiStatus.POLLING) {
          stopPolling();
        }
      } catch (error) {
        console.error('Error during polling:', error);
        setStatusCTI({ status: CtiStatus.ERROR, details: CtiDetails.ERROR });
        stopPolling();
      }
    }, 5000);
  }, [stopPolling]);

  const checkCtiStatus = useCallback(async () => {
    try {
      const response = await getApiInfo();
      const statusRegistration = response.affected_items?.[0]
        ?.wazuh_cti_auth || {
        status: CtiStatus.PENDING,
        details: CtiDetails.PENDING,
      };

      // Only update statusCTI if the status changed
      if (previousStatusRef.current?.status !== statusRegistration.status) {
        setStatusCTI(statusRegistration);
        previousStatusRef.current = statusRegistration;
      }

      // If PENDING, start polling
      if (statusRegistration.status === CtiStatus.POLLING) {
        startPolling();
      } else {
        // If not PENDING, stop polling
        setStatusCTI(statusRegistration);
        stopPolling();
      }
    } catch (error) {
      console.error('Error checking CTI status:', error);
      setStatusCTI({ status: CtiStatus.ERROR, details: CtiDetails.ERROR });
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
    statusCTI,
    checkCtiStatus,
    startPolling,
    stopPolling,
  };
};
