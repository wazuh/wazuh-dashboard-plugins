import { useState, useEffect } from 'react';
import { getTasks } from '../services';
import { API_NAME_TASK_STATUS } from '../../../../common/constants';

const beforeMinutes = 60;

export const useGetUpgradeTasks = (reload: any) => {
  const [totalInProgressTasks, setTotalInProgressTasks] = useState<number>(0);
  const [getInProgressIsLoading, setGetInProgressIsLoading] = useState(true);
  const [getInProgressError, setGetInProgressError] = useState();

  const [totalSuccessTasks, setTotalSuccessTasks] = useState<number>(0);
  const [getSuccessIsLoading, setSuccessIsLoading] = useState(true);
  const [getSuccessError, setGetSuccessError] = useState();

  const [totalErrorUpgradeTasks, setTotalErrorUpgradeTasks] =
    useState<number>(0);
  const [getErrorIsLoading, setErrorIsLoading] = useState(true);
  const [getErrorTasksError, setGetErrorTasksError] = useState();

  const [totalTimeoutUpgradeTasks, setTotalTimeoutUpgradeTasks] =
    useState<number>(0);
  const [getTimeoutIsLoading, setTimeoutIsLoading] = useState(true);
  const [getTimeoutError, setGetTimeoutError] = useState();

  const datetime = new Date();
  datetime.setMinutes(datetime.getMinutes() - beforeMinutes);
  const formattedDate = datetime.toISOString();
  const timeFilter = `last_update_time>${formattedDate}`;

  const getUpgradeStatus = async (
    status: string,
    setIsLoading: (isLoading: boolean) => void,
    setTotalTasks: (totalTasks: number) => void,
    setError: (error) => void,
    q?: string,
  ) => {
    try {
      setIsLoading(true);
      const { total_affected_items } = await getTasks({
        status,
        command: 'upgrade',
        limit: 1,
        q,
      });
      setTotalTasks(total_affected_items);
      setError(undefined);
    } catch (error: any) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUpgradesInProgress = async () =>
    await getUpgradeStatus(
      API_NAME_TASK_STATUS.IN_PROGRESS,
      setGetInProgressIsLoading,
      setTotalInProgressTasks,
      setGetInProgressError,
    );

  const getUpgradesSuccess = async () => {
    await getUpgradeStatus(
      API_NAME_TASK_STATUS.DONE,
      setSuccessIsLoading,
      setTotalSuccessTasks,
      setGetSuccessError,
      timeFilter,
    );
  };

  const getUpgradesError = async () => {
    await getUpgradeStatus(
      API_NAME_TASK_STATUS.FAILED,
      setErrorIsLoading,
      setTotalErrorUpgradeTasks,
      setGetErrorTasksError,
      timeFilter,
    );
  };

  const getUpgradeTimeout = async () => {
    await getUpgradeStatus(
      API_NAME_TASK_STATUS.TIMEOUT,
      setTimeoutIsLoading,
      setTotalTimeoutUpgradeTasks,
      setGetTimeoutError,
      timeFilter,
    );
  };

  const fetchData = async () => {
    await getUpgradesInProgress();
    await getUpgradesSuccess();
    await getUpgradesError();
    await getUpgradeTimeout();
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(getUpgradesInProgress, 3000);

    if (totalInProgressTasks === 0) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [totalInProgressTasks, reload]);

  return {
    getInProgressIsLoading,
    totalInProgressTasks,
    getInProgressError,
    getSuccessIsLoading,
    totalSuccessTasks,
    getSuccessError,
    getErrorIsLoading,
    totalErrorUpgradeTasks,
    getErrorTasksError,
    getTimeoutIsLoading,
    totalTimeoutUpgradeTasks,
    getTimeoutError,
  };
};
