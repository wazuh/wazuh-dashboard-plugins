import { useCallback, useEffect, useState } from 'react';
import {
  CatalogRequestError,
  toCatalogRequestError,
} from '../../../services/cti-catalog';

export interface CatalogRequestState<T> {
  data: T | null;
  error: CatalogRequestError | null;
  loading: boolean;
  /** Runs the request again with the same inputs. */
  reload: () => void;
}

const isAbort = (error: unknown) =>
  (error as { name?: string } | null)?.name === 'AbortError';

/**
 * Runs `request` when the hook mounts and again whenever `deps` change. A newer
 * run aborts the one in flight, so a slow answer never replaces a newer one.
 * `request` returning `null` skips the run and clears the state.
 */
export function useCatalogRequest<T>(
  request: (signal: AbortSignal) => Promise<T> | null,
  deps: React.DependencyList,
): CatalogRequestState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<CatalogRequestError | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const pending = request(controller.signal);
    if (!pending) {
      setData(null);
      setError(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    pending.then(
      result => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      },
      reason => {
        if (!controller.signal.aborted && !isAbort(reason)) {
          setData(null);
          setError(toCatalogRequestError(reason));
          setLoading(false);
        }
      },
    );
    return () => controller.abort();
    // `request` is rebuilt every render; `deps` say when it really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { data, error, loading, reload };
}
