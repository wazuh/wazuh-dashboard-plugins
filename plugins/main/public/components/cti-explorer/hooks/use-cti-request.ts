import { useCallback, useEffect, useState } from 'react';
import {
  CtiRequestError,
  toCtiRequestError,
} from '../services/cti-explorer-api';

export interface CtiRequestState<T> {
  loading: boolean;
  /** The last data read; kept while a new request runs, so a table does not empty on paging. */
  data: T | null;
  error: CtiRequestError | null;
  reload: () => void;
}

/**
 * Runs `request` on mount and whenever `dependencies` change. A response that
 * arrives after a newer request started is dropped, so fast paging cannot
 * show an older page.
 */
export function useCtiRequest<T>(
  request: () => Promise<T>,
  dependencies: unknown[],
): CtiRequestState<T> {
  const [reloads, setReloads] = useState(0);
  const [state, setState] = useState<Omit<CtiRequestState<T>, 'reload'>>({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let current = true;
    setState(previous => ({ ...previous, loading: true, error: null }));
    request()
      .then(data => {
        if (current) {
          setState({ loading: false, data, error: null });
        }
      })
      .catch(error => {
        if (current) {
          setState({
            loading: false,
            data: null,
            error: toCtiRequestError(error),
          });
        }
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, reloads]);

  const reload = useCallback(() => setReloads(count => count + 1), []);

  return { ...state, reload };
}
