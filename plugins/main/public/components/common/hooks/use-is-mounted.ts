import { useCallback, useEffect, useRef } from 'react';

export const useIsMounted = () => {
  const isMounted = useRef(false);
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      abortControllerRef.current.abort();
    };
  }, []);

  const getAbortController = useCallback(() => {
    if (!isMounted.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current;
  }, []);

  const isComponentMounted = useCallback(() => isMounted.current, []);

  return { isComponentMounted, getAbortController };
};
