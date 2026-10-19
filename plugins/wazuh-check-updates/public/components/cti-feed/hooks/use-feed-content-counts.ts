import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FeedContentCounts,
  fetchFeedContentCounts,
} from '../../../services/cti-feed';

export const useFeedContentCounts = () => {
  const [counts, setCounts] = useState<FeedContentCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    // Never rejects: each count settles to a number or `null` on its own.
    const next = await fetchFeedContentCounts();
    if (mounted.current) {
      setCounts(next);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { counts, loading, refetch };
};
