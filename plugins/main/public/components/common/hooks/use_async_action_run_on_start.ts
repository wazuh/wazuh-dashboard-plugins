import { useCallback, useState, useEffect } from 'react';

type useAsyncActionRunOnStartAction<T> = (...params: any[]) => Promise<T>;
type useAsyncActionRunOnStartDependencies = any[];
type useAsyncActionRunOnStartDependenciesReturns<T> = {
  data: T | null;
  error: Error | null;
  running: boolean;
  run: () => Promise<void>;
};

/**
 * Get data from an asynchronous process. Manage data, error and running states while running the process. It starts with running status activated, so this is
 * useful to get data when a component is mounted. The dependencies parameter is passed as parameters to the action function. When the process runs,
 * the data and error states are reset. If the action function or dependencies change, it will run the process again. The run function is exposed.
 * @param action Define the function to get the data. It reveive the dependencies as params
 * @param dependencies Define the dependencies to rerun the process
 * @returns It returns data, error, run, running
 */
export function useAsyncActionRunOnStart<T>(
  action: useAsyncActionRunOnStartAction<T>,
  dependencies: useAsyncActionRunOnStartDependencies = [],
  { refreshDataOnPreRun = true } = { refreshDataOnPreRun: true },
): useAsyncActionRunOnStartDependenciesReturns<T> {
  const [running, setRunning] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async () => {
    try {
      setRunning(true);
      setError(null);
      if (refreshDataOnPreRun) {
        setData(null);
      }
      const data = await action(...dependencies);
      setData(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setRunning(false);
    }
  }, [action, ...dependencies]);

  useEffect(() => {
    run();
  }, [action, ...dependencies]);

  return { data, error, run, running };
}
