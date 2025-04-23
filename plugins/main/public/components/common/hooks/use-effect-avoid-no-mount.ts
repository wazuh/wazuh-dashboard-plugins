import { useEffect, useRef } from 'react';

export const useEffectAvoidOnNotMount = (fn, deps) => {
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
