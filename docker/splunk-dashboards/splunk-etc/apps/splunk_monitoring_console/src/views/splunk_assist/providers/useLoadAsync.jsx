import { useCallback, useEffect, useState } from 'react';

export const AsyncLoadingStates = { NEW: 'NEW', PENDING: 'PENDING', COMPLETE: 'COMPLETE', ERROR: 'ERROR' };

export function isLoadingState(state) {
    return state === AsyncLoadingStates.NEW || state === AsyncLoadingStates.PENDING;
}

/**
 *
 * @param {*} asyncLoadFn
 * @returns {{error?: Error, loadingState: string, refresh: () => void, value?: any}}
 */
export function useLoadAsync(asyncLoadFn) {
    const [value, setValue] = useState(undefined);
    const [loadingState, setLoadingState] = useState(AsyncLoadingStates.NEW);
    const [error, setError] = useState(undefined);
    const [lastRefresh, setLastRefresh] = useState(0);

    const refresh = useCallback(() => {
        setLastRefresh((old) => (old < 1000 ? old + 1 : 0));
    }, []);

    useEffect(() => {
        let didCancel = false;

        async function load() {
            try {
                setValue(undefined);
                setLoadingState(AsyncLoadingStates.PENDING);
                const result = await asyncLoadFn();
                if (didCancel) {
                    return;
                }
                setValue(result);
                setLoadingState(AsyncLoadingStates.COMPLETE);
            } catch (err) {
                if (didCancel) {
                    return;
                }

                setLoadingState(AsyncLoadingStates.ERROR);
                setError(err);
            }
        }

        load();

        return () => {
            didCancel = true;
        };
    }, [asyncLoadFn, lastRefresh]);

    return { loadingState, refresh, error, value };
}
