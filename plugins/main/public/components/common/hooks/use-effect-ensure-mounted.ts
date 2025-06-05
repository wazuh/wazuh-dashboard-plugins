import { useEffect, useRef } from 'react';

export const useEffectEnsureComponentMounted = (fn, deps) => {
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (isMountedRef.current) {
      fn();
    }
  }, deps);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);
};
